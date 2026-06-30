from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from models.database import get_db
from models.models import User, Post, LinkedInAccount
from routers.auth import get_current_user
from services.linkedin_service import LinkedInService

router = APIRouter()
li_service = LinkedInService()


class ManualPostRequest(BaseModel):
    content: str
    image_url: Optional[str] = ""
    scheduled_at: Optional[datetime] = None


@router.post("/post")
async def manual_post(req: ManualPostRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not req.content.strip():
        raise HTTPException(400, "Post content cannot be empty")
    if len(req.content) > 3000:
        raise HTTPException(400, "Post exceeds LinkedIn's 3000 character limit")

    account = db.query(LinkedInAccount).filter(LinkedInAccount.user_id == user.id).first()
    if not account:
        raise HTTPException(404, "LinkedIn account not connected")

    if req.scheduled_at and req.scheduled_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        post = Post(
            user_id=user.id, content=req.content, image_url=req.image_url or "",
            status="approved", scheduled_at=req.scheduled_at, topic="Manual",
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        from celery_app import publish_single
        delta = (req.scheduled_at.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).total_seconds()
        task = publish_single.apply_async(args=[post.id], countdown=max(delta, 0))
        post.celery_task_id = task.id
        db.commit()

        return {"status": "scheduled", "post_id": post.id, "scheduled_at": req.scheduled_at}

    try:
        li_post_id = await li_service.create_post(
            access_token=account.access_token, person_id=account.li_person_id,
            content=req.content, image_url=req.image_url or None,
        )
        post = Post(
            user_id=user.id, content=req.content, image_url=req.image_url or "",
            status="posted", li_post_id=li_post_id, posted_at=datetime.utcnow(), topic="Manual",
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return {"status": "posted", "post_id": post.id, "li_post_id": li_post_id}
    except Exception as e:
        raise HTTPException(500, f"LinkedIn post failed: {e}")
