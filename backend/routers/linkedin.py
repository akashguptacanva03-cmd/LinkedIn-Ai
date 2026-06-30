import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.models import User, LinkedInAccount
from routers.auth import get_current_user
from services.linkedin_service import LinkedInService

router = APIRouter()
li_service = LinkedInService()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# In-memory state store: oauth "state" -> user_id
_pending_states: dict = {}


@router.get("/connect")
async def connect(user: User = Depends(get_current_user)):
    state = str(uuid.uuid4())
    _pending_states[state] = user.id
    return {"auth_url": li_service.get_auth_url(state)}


@router.get("/callback")
async def callback(code: str = None, state: str = None, error: str = None, db: Session = Depends(get_db)):
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error={error}")

    user_id = _pending_states.pop(state, None)
    if not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error=invalid_state")

    try:
        token_data = await li_service.exchange_code(code)
        access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 5184000)  # default 60 days
        profile = await li_service.get_profile(access_token)
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error=token_exchange_failed")

    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    existing = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user_id).first()
    if existing:
        existing.access_token  = access_token
        existing.expires_at    = expires_at
        existing.li_person_id  = profile["sub"]
        existing.li_name       = profile.get("name", "")
        existing.li_avatar     = profile.get("picture", "")
    else:
        db.add(LinkedInAccount(
            user_id      = user_id,
            access_token = access_token,
            expires_at   = expires_at,
            li_person_id = profile["sub"],
            li_name      = profile.get("name", ""),
            li_avatar    = profile.get("picture", ""),
            connected_at = datetime.utcnow(),
        ))
    db.commit()
    return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_connected=true")


@router.get("/status")
async def status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user.id).first()
    if not account:
        return {"connected": False}
    expired = account.expires_at and account.expires_at < datetime.utcnow()
    return {
        "connected": True,
        "name":      account.li_name,
        "avatar":    account.li_avatar,
        "expired":   expired,
        "person_id": account.li_person_id,
    }


@router.post("/disconnect")
async def disconnect(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user.id).first()
    if account:
        db.delete(account)
        db.commit()
    return {"disconnected": True}
