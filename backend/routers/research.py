from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from models.database import get_db
from models.models import User, UserSettings, LinkedInAccount
from routers.auth import get_current_user
from services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


def _get_api_key(provider: str, settings: UserSettings) -> str:
    if provider == "openai" and settings:
        return settings.openai_key or ""
    if provider == "gemini" and settings:
        return settings.gemini_key or ""
    return ""


# ── Research chat ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    niche: str = "LinkedIn content"
    provider: str = "claude"


@router.post("/chat")
async def research_chat(req: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    api_key = _get_api_key(req.provider, settings)

    convo = "\n\n".join(f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}" for m in req.messages[-6:])
    system = (
        f"You are an expert LinkedIn content strategist. Help with trending topics, "
        f"hooks, and content ideas. User niche: {req.niche}. Be specific and actionable. "
        f"End with 1-2 next steps."
    )

    try:
        result = await ai_service.generate(req.provider, f"Conversation:\n{convo}\n\nRespond to the User's last message.", api_key, system)
        return {"reply": result["text"]}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Account analysis ──────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    provider: str = "claude"


@router.post("/analyze")
async def analyze_account(req: AnalyzeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(400, "LinkedIn account not connected")

    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    api_key = _get_api_key(req.provider, settings)

    # NOTE: LinkedIn's API does not expose detailed post analytics for most apps
    # without additional partner-level permissions. This summarizes from your own
    # post history stored in this app instead.
    from models.models import Post
    posts = db.query(Post).filter(Post.user_id == user.id, Post.status == "posted").order_by(Post.posted_at.desc()).limit(10).all()

    if not posts:
        return {"report": "No posted content yet. Post a few times via LinkedPilot, then run this analysis again for personalized insights."}

    post_summary = "\n".join(f"- \"{p.content[:60]}...\": {p.likes} likes, {p.comments} comments" for p in posts)

    prompt = f"""Analyze this LinkedIn account's recent posts (from our own tracking):

{post_summary}

Provide:
## 📊 Performance Summary
## 🔥 What's Working
## 📉 What Needs Improvement
## 🎯 Top 5 Topic Recommendations for Next Month
## ⏰ Optimal Posting Strategy
## 🚀 3 Immediate Action Items

Be specific and data-driven."""

    try:
        result = await ai_service.generate(req.provider, prompt, api_key)
        return {"report": result["text"]}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Topic ideas ────────────────────────────────────────────────────────────

class TopicIdeasRequest(BaseModel):
    niche: str
    audience: str = "LinkedIn professionals"
    style: str = "mixed"
    provider: str = "claude"


@router.post("/topic-ideas")
async def topic_ideas(req: TopicIdeasRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    api_key = _get_api_key(req.provider, settings)

    prompt = f"""Generate 12 specific LinkedIn post topic ideas for:
Niche: {req.niche}
Audience: {req.audience}
Style: {req.style}

For each, use EXACTLY this format:
TITLE: [hook/title max 12 words]
ANGLE: [specific angle in 1 sentence]
WHY: [why it performs on LinkedIn]
FORMAT: [List post/Story/Thought leadership/How-to/Poll]

Number 1-12. Be specific to {req.niche}."""

    try:
        result = await ai_service.generate(req.provider, prompt, api_key)
        return {"raw": result["text"]}
    except Exception as e:
        raise HTTPException(500, str(e))
