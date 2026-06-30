import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery = Celery("linkedpilot", broker=REDIS_URL, backend=REDIS_URL)
celery.conf.timezone = "UTC"


@celery.task(name="celery_app.publish_single")
def publish_single(post_id: str):
    """Publish a single scheduled post at its scheduled time."""
    import asyncio
    from models.database import SessionLocal
    from models.models import Post, LinkedInAccount
    from services.linkedin_service import LinkedInService
    from datetime import datetime

    db  = SessionLocal()
    li  = LinkedInService()
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post or post.status != "approved":
            return {"skipped": True, "reason": "not found or not approved"}

        account = db.query(LinkedInAccount).filter(
            LinkedInAccount.user_id == post.user_id).first()
        if not account:
            post.status = "failed"
            db.commit()
            return {"error": "LinkedIn not connected"}

        li_id = asyncio.run(li.create_post(
            account.access_token, account.li_person_id,
            post.content, post.image_url or None,
        ))
        post.status    = "posted"
        post.li_post_id = li_id
        post.posted_at = datetime.utcnow()
        db.commit()
        return {"status": "posted", "post_id": post.id}
    except Exception as e:
        if db.query(Post).filter(Post.id == post_id).first():
            db.query(Post).filter(Post.id == post_id).update({"status": "failed"})
            db.commit()
        return {"error": str(e)}
    finally:
        db.close()


@celery.task(name="celery_app.run_pipeline_for_user")
def run_pipeline_for_user(user_id: str):
    """Run one automation cycle for a user.
    Respects each user's configured frequency by checking their last run time."""
    import asyncio
    import random
    from models.database import SessionLocal
    from models.models import AutomationTopic, UserSettings, LinkedInAccount, Post
    from services.ai_service import AIService
    from services.linkedin_service import LinkedInService
    from datetime import datetime, timedelta

    db  = SessionLocal()
    ai  = AIService()
    li  = LinkedInService()
    try:
        settings = db.query(UserSettings).filter(
            UserSettings.user_id == user_id).first()
        if not settings or not settings.pipeline_active:
            return {"skipped": "pipeline not active"}

        # Respect the user's chosen frequency
        freq_hours = {"hourly": 1, "daily": 24, "twice": 12, "weekly": 168}
        required_gap = timedelta(hours=freq_hours.get(settings.pipeline_freq, 24))
        last_auto = db.query(Post).filter(
            Post.user_id == user_id, Post.auto == True
        ).order_by(Post.created_at.desc()).first()
        if last_auto and (datetime.utcnow() - last_auto.created_at) < required_gap:
            return {"skipped": f"frequency not reached ({settings.pipeline_freq})"}

        topics = db.query(AutomationTopic).filter(
            AutomationTopic.user_id == user_id,
            AutomationTopic.active  == True,
        ).all()
        if not topics:
            return {"skipped": "no active topics"}

        provider = settings.default_ai or "claude"
        api_key  = (settings.openai_key if provider == "openai"
                    else settings.gemini_key if provider == "gemini" else "")

        picked = random.choice(topics)
        prompt = (
            f'Write a compelling LinkedIn post about: "{picked.topic}". '
            f"Tone: {picked.tone}. 150-250 words, 2-3 emojis, "
            f"end with an engaging question, 4-6 hashtags. Return ONLY the post text."
        )
        content = asyncio.run(ai.generate(provider, prompt, api_key))["text"]

        image_url, image_prompt = "", ""
        if settings.gen_image:
            try:
                ip = asyncio.run(ai.generate(
                    provider,
                    f"DALL-E image prompt (max 80 words) for a LinkedIn post about: "
                    f'"{picked.topic}". Professional photorealistic style, no text.',
                    api_key,
                ))["text"].strip()
                image_prompt = ip
                image_url    = asyncio.run(
                    ai.generate_image(ip, settings.openai_key or ""))
            except Exception:
                pass

        account = db.query(LinkedInAccount).filter(
            LinkedInAccount.user_id == user_id).first()
        status, li_id = "pending", ""
        if settings.auto_post and account:
            try:
                li_id  = asyncio.run(li.create_post(
                    account.access_token, account.li_person_id,
                    content, image_url or None,
                ))
                status = "posted"
            except Exception:
                status = "failed"

        post = Post(
            user_id=user_id, content=content,
            image_url=image_url, image_prompt=image_prompt,
            status=status, topic=picked.topic, tone=picked.tone,
            ai_provider=provider, auto=True, li_post_id=li_id,
            posted_at=datetime.utcnow() if status == "posted" else None,
        )
        db.add(post)
        db.commit()
        return {"status": status, "topic": picked.topic}
    finally:
        db.close()


@celery.task(name="celery_app.run_all_pipelines")
def run_all_pipelines():
    """Beat task — every hour, triggers a pipeline check for each active user."""
    from models.database import SessionLocal
    from models.models import UserSettings

    db = SessionLocal()
    try:
        active = db.query(UserSettings).filter(
            UserSettings.pipeline_active == True).all()
        for s in active:
            run_pipeline_for_user.delay(s.user_id)
        return {"triggered": len(active)}
    finally:
        db.close()


@celery.task(name="celery_app.publish_scheduled_posts")
def publish_scheduled_posts():
    """Beat task — every 5 minutes, publish any posts whose scheduled_at has passed."""
    import asyncio
    from models.database import SessionLocal
    from models.models import Post, LinkedInAccount
    from services.linkedin_service import LinkedInService
    from datetime import datetime

    db = SessionLocal()
    li = LinkedInService()
    try:
        due = db.query(Post).filter(
            Post.status      == "approved",
            Post.scheduled_at != None,
            Post.scheduled_at <= datetime.utcnow(),
        ).all()
        results = []
        for post in due:
            account = db.query(LinkedInAccount).filter(
                LinkedInAccount.user_id == post.user_id).first()
            if not account:
                post.status = "failed"
                db.commit()
                continue
            try:
                li_id = asyncio.run(li.create_post(
                    account.access_token, account.li_person_id,
                    post.content, post.image_url or None,
                ))
                post.status     = "posted"
                post.li_post_id = li_id
                post.posted_at  = datetime.utcnow()
            except Exception as e:
                post.status = "failed"
            db.commit()
            results.append(post.id)
        return {"published": len(results)}
    finally:
        db.close()


celery.conf.beat_schedule = {
    "check-pipelines-hourly": {
        "task":     "celery_app.run_all_pipelines",
        "schedule": crontab(minute=0),
    },
    "publish-scheduled-every-5min": {
        "task":     "celery_app.publish_scheduled_posts",
        "schedule": crontab(minute="*/5"),
    },
}
