import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.database import get_db
from models.models import User, AutomationTopic, Post, LinkedInAccount, UserSettings
from routers.auth import get_current_user
from services.ai_service import AIService
from services.linkedin_service import LinkedInService

router = APIRouter()
ai_service = AIService()
li_service = LinkedInService()


def topic_to_dict(t: AutomationTopic) -> dict:
    return {"id": t.id, "topic": t.topic, "tone": t.tone, "active": t.active}


# ── Topics CRUD ─────────────────────────────────────────────────────────────

@router.get("/topics")
async def list_topics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    topics = db.query(AutomationTopic).filter(AutomationTopic.user_id == user.id).all()
    return [topic_to_dict(t) for t in topics]


class TopicRequest(BaseModel):
    topic: str
    tone: str = "Professional"


@router.post("/topics")
async def add_topic(req: TopicRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = AutomationTopic(user_id=user.id, topic=req.topic, tone=req.tone, active=True)
    db.add(t)
    db.commit()
    db.refresh(t)
    return topic_to_dict(t)


@router.patch("/topics/{topic_id}/toggle")
async def toggle_topic(topic_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(AutomationTopic).filter(AutomationTopic.id == topic_id, AutomationTopic.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Topic not found")
    t.active = not t.active
    db.commit()
    return topic_to_dict(t)


@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(AutomationTopic).filter(AutomationTopic.id == topic_id, AutomationTopic.user_id == user.id).first()
    if t:
        db.delete(t)
        db.commit()
    return {"deleted": True}


# ── Pipeline settings ────────────────────────────────────────────────────────

class PipelineSettingsRequest(BaseModel):
    pipeline_active: bool = None
    pipeline_freq: str = None
    pipeline_time: str = None
    auto_post: bool = None
    gen_image: bool = None
    default_ai: str = None


@router.get("/settings")
async def get_pipeline_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Settings not found")
    return {
        "pipeline_active": s.pipeline_active, "pipeline_freq": s.pipeline_freq,
        "pipeline_time": s.pipeline_time, "auto_post": s.auto_post,
        "gen_image": s.gen_image, "default_ai": s.default_ai,
    }


@router.patch("/settings")
async def update_pipeline_settings(req: PipelineSettingsRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Settings not found")
    for field, value in req.dict(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    return {"updated": True}


# ── Run pipeline now ──────────────────────────────────────────────────────────

@router.post("/run")
async def run_pipeline(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Pick a random active topic, generate content + image with AI,
    then either post directly to LinkedIn (if auto_post is on and LinkedIn
    is connected) or add it to the approval queue.
    """
    active_topics = db.query(AutomationTopic).filter(
        AutomationTopic.user_id == user.id, AutomationTopic.active == True
    ).all()
    if not active_topics:
        raise HTTPException(400, "No active topics in your pipeline")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    provider = settings.default_ai if settings else "claude"
    api_key = ""
    if provider == "openai" and settings:
        api_key = settings.openai_key
    elif provider == "gemini" and settings:
        api_key = settings.gemini_key

    picked = random.choice(active_topics)

    prompt = f"""Write a compelling LinkedIn post about: "{picked.topic}".
Tone: {picked.tone}.
Requirements: 150-250 words, natural line breaks, 2-3 relevant emojis,
end with an engaging question, 4-6 hashtags. Return ONLY the post text."""

    try:
        result = await ai_service.generate(provider, prompt, api_key)
        content = result["text"]
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {e}")

    image_url = ""
    image_prompt = ""
    if not settings or settings.gen_image:
        try:
            img_prompt_result = await ai_service.generate(
                provider,
                f"Create a concise DALL-E image prompt (max 100 words) for a LinkedIn post about: '{picked.topic}'. Photorealistic, professional style.",
                api_key,
            )
            image_prompt = img_prompt_result["text"].strip()
            openai_key = settings.openai_key if settings else ""
            image_url = await ai_service.generate_image(image_prompt, openai_key)
        except Exception:
            pass

    account = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user.id).first()
    auto_post = settings.auto_post if settings else False
    status = "pending"
    li_post_id = ""

    if auto_post and account:
        try:
            li_post_id = await li_service.create_post(
                access_token=account.access_token,
                person_id=account.li_person_id,
                content=content,
                image_url=image_url or None,
            )
            status = "posted"
        except Exception:
            status = "failed"

    post = Post(
        user_id=user.id, content=content, image_url=image_url, image_prompt=image_prompt,
        status=status, topic=picked.topic, tone=picked.tone, ai_provider=provider,
        auto=True, li_post_id=li_post_id,
        posted_at=datetime.utcnow() if status == "posted" else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return {
        "post_id": post.id, "topic_used": picked.topic, "status": status,
        "content": content, "image_url": image_url, "image_prompt": image_prompt,
    }
