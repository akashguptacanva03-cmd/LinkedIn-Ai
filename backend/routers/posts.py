from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from models.database import get_db
from models.models import User, Post, LinkedInAccount, UserSettings
from routers.auth import get_current_user
from services.ai_service import AIService
from services.linkedin_service import LinkedInService

router = APIRouter()
ai_service = AIService()
li_service = LinkedInService()


def post_to_dict(p: Post) -> dict:
    return {
        "id": p.id, "content": p.content, "image_url": p.image_url, "image_prompt": p.image_prompt,
        "status": p.status, "topic": p.topic, "tone": p.tone, "ai_provider": p.ai_provider,
        "auto": p.auto, "revised": p.revised, "reject_reason": p.reject_reason, "reject_type": p.reject_type,
        "scheduled_at": p.scheduled_at.isoformat() if p.scheduled_at else None,
        "posted_at": p.posted_at.isoformat() if p.posted_at else None,
        "li_post_id": p.li_post_id, "likes": p.likes, "comments": p.comments, "impressions": p.impressions,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("")
async def list_posts(status: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Post).filter(Post.user_id == user.id)
    if status and status != "all":
        q = q.filter(Post.status == status)
    posts = q.order_by(Post.created_at.desc()).all()
    return [post_to_dict(p) for p in posts]


class CreatePostRequest(BaseModel):
    content: str
    image_url: str = ""
    image_prompt: str = ""
    status: str = "draft"
    topic: str = ""
    tone: str = "Professional"
    ai_provider: str = ""
    auto: bool = False


@router.post("")
async def create_post(req: CreatePostRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = Post(user_id=user.id, **req.dict())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_dict(post)


class UpdatePostRequest(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None


@router.patch("/{post_id}")
async def update_post(post_id: str, req: UpdatePostRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if req.content is not None:
        post.content = req.content
    if req.image_url is not None:
        post.image_url = req.image_url
    db.commit()
    db.refresh(post)
    return post_to_dict(post)


@router.delete("/{post_id}")
async def delete_post(post_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()
    return {"deleted": True}


@router.post("/{post_id}/approve")
async def approve_post(post_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Approve a post — publishes it to LinkedIn immediately, with its image."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    account = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(400, "LinkedIn account not connected")

    try:
        li_post_id = await li_service.create_post(
            access_token=account.access_token,
            person_id=account.li_person_id,
            content=post.content,
            image_url=post.image_url or None,
        )
        post.status = "posted"
        post.li_post_id = li_post_id
        post.posted_at = datetime.utcnow()
        db.commit()
        db.refresh(post)
        return post_to_dict(post)
    except Exception as e:
        post.status = "failed"
        db.commit()
        raise HTTPException(500, f"Failed to post to LinkedIn: {e}")


class RejectRequest(BaseModel):
    reason: str
    reject_type: str = "both"   # content | image | both


@router.post("/{post_id}/reject")
async def reject_post(post_id: str, req: RejectRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reject a post with remarks. Does not regenerate automatically —
    call /regenerate next to have the AI fix it using these remarks."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    post.status = "rejected"
    post.reject_reason = req.reason
    post.reject_type = req.reject_type
    post.revised = False
    db.commit()
    db.refresh(post)
    return post_to_dict(post)


@router.post("/{post_id}/regenerate")
async def regenerate_post(post_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Regenerate a rejected post's content and/or image using AI,
    informed by the rejection remarks. Re-queues it as 'pending'."""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.status != "rejected":
        raise HTTPException(400, "Only rejected posts can be regenerated")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    provider = post.ai_provider or (settings.default_ai if settings else "claude")
    api_key = ""
    if provider == "openai" and settings:
        api_key = settings.openai_key
    elif provider == "gemini" and settings:
        api_key = settings.gemini_key

    try:
        if post.reject_type in ("content", "both"):
            prompt = f"""Rewrite this LinkedIn post about "{post.topic}".

PREVIOUS VERSION (rejected):
{post.content}

REJECTION FEEDBACK:
{post.reject_reason}

Write an improved version that fixes these issues. Tone: {post.tone}.
150-250 words, natural emojis, end with a question, 4-6 hashtags. Return ONLY the post text."""
            result = await ai_service.generate(provider, prompt, api_key)
            post.content = result["text"]

        if post.reject_type in ("image", "both"):
            img_prompt_result = await ai_service.generate(
                provider,
                f"""Generate an improved DALL-E image prompt for a LinkedIn post about: "{post.topic}".
Previous prompt (rejected): {post.image_prompt or 'none'}
Feedback: {post.reject_reason}
Return ONLY the new image prompt, max 100 words, photorealistic professional style.""",
                api_key,
            )
            new_prompt = img_prompt_result["text"].strip()
            post.image_prompt = new_prompt
            post.image_url = await ai_service.generate_image(new_prompt, api_key if provider == "openai" else "")

        post.status = "pending"
        post.revised = True
        post.reject_reason = ""
        post.reject_type = ""
        db.commit()
        db.refresh(post)
        return post_to_dict(post)

    except Exception as e:
        raise HTTPException(500, f"Regeneration failed: {e}")
