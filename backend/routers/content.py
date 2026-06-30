from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.database import get_db
from models.models import User, UserSettings
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


class GenerateRequest(BaseModel):
    topic: str
    tone: str = "Professional"
    keywords: str = ""
    provider: str = "claude"
    generate_image: bool = True


@router.post("/generate")
async def generate_content(req: GenerateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate LinkedIn post text + (optionally) a real AI image for it."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    api_key = _get_api_key(req.provider, settings)

    prompt = f"""Write a compelling LinkedIn post about: "{req.topic}".
Tone: {req.tone}.{f' Keywords to include: {req.keywords}.' if req.keywords else ''}
Requirements: 150-250 words, natural line breaks, 2-3 relevant emojis,
end with an engaging question, 4-6 hashtags. Return ONLY the post text."""

    try:
        result = await ai_service.generate(req.provider, prompt, api_key)
        content = result["text"]
    except Exception as e:
        raise HTTPException(500, f"Content generation failed: {e}")

    image_url = ""
    image_prompt = ""
    if req.generate_image:
        try:
            img_prompt_result = await ai_service.generate(
                req.provider,
                f"Create a concise DALL-E image prompt (max 100 words) for a professional LinkedIn post about: '{req.topic}'. Photorealistic, professional corporate style, no text in image.",
                api_key,
            )
            image_prompt = img_prompt_result["text"].strip()
            openai_key = settings.openai_key if settings else ""
            image_url = await ai_service.generate_image(image_prompt, openai_key)
        except Exception:
            # Image generation failing shouldn't block the content generation result
            pass

    return {"content": content, "image_url": image_url, "image_prompt": image_prompt}
