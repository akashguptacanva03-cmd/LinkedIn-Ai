from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from models.database import get_db
from models.models import User, UserSettings
from routers.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Settings not found")
    return {
        "openai_key_set":    bool(s.openai_key),
        "gemini_key_set":    bool(s.gemini_key),
        "default_ai":        s.default_ai,
        "pipeline_active":   s.pipeline_active,
        "pipeline_freq":     s.pipeline_freq,
        "pipeline_time":     s.pipeline_time,
        "auto_post":         s.auto_post,
        "gen_image":         s.gen_image,
    }


class ApiKeysRequest(BaseModel):
    openai_key:  Optional[str] = None
    gemini_key:  Optional[str] = None
    default_ai:  Optional[str] = None   # claude | openai | gemini


@router.patch("/api-keys")
async def update_api_keys(
    req: ApiKeysRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Settings not found")
    if req.openai_key is not None:
        s.openai_key = req.openai_key
    if req.gemini_key is not None:
        s.gemini_key = req.gemini_key
    if req.default_ai is not None:
        if req.default_ai not in ("claude", "openai", "gemini"):
            raise HTTPException(400, "default_ai must be claude, openai, or gemini")
        s.default_ai = req.default_ai
    db.commit()
    return {"updated": True}


class PipelinePrefsRequest(BaseModel):
    pipeline_active: Optional[bool] = None
    pipeline_freq:   Optional[str]  = None   # hourly|daily|twice|weekly
    pipeline_time:   Optional[str]  = None   # "HH:MM"
    auto_post:       Optional[bool] = None
    gen_image:       Optional[bool] = None


@router.patch("/pipeline")
async def update_pipeline_prefs(
    req: PipelinePrefsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Settings not found")
    if req.pipeline_active is not None:
        s.pipeline_active = req.pipeline_active
    if req.pipeline_freq is not None:
        if req.pipeline_freq not in ("hourly", "daily", "twice", "weekly"):
            raise HTTPException(400, "Invalid frequency")
        s.pipeline_freq = req.pipeline_freq
    if req.pipeline_time is not None:
        s.pipeline_time = req.pipeline_time
    if req.auto_post is not None:
        s.auto_post = req.auto_post
    if req.gen_image is not None:
        s.gen_image = req.gen_image
    db.commit()
    return {"updated": True}
