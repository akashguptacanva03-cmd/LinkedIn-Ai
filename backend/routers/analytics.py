from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from models.database import get_db
from models.models import User, Post
from routers.auth import get_current_user

router = APIRouter()


@router.get("/summary")
async def analytics_summary(
    user: User = Depends(get_current_user),
    db:   Session = Depends(get_db),
):
    """Return engagement totals and per-post stats from our own DB."""
    posts = db.query(Post).filter(
        Post.user_id == user.id,
        Post.status  == "posted",
    ).order_by(Post.posted_at.desc()).all()

    total_likes       = sum(p.likes       for p in posts)
    total_comments    = sum(p.comments    for p in posts)
    total_impressions = sum(p.impressions for p in posts)

    # Posts per provider
    by_provider: dict = {}
    for p in posts:
        by_provider[p.ai_provider or "manual"] = \
            by_provider.get(p.ai_provider or "manual", 0) + 1

    # Posts in the last 30 days
    cutoff   = datetime.utcnow() - timedelta(days=30)
    recent   = [p for p in posts if p.posted_at and p.posted_at >= cutoff]
    auto_cnt = sum(1 for p in posts if p.auto)

    # Best performing post
    best = max(posts, key=lambda p: p.likes, default=None)

    return {
        "total_posts":       len(posts),
        "posts_last_30_days": len(recent),
        "auto_generated":    auto_cnt,
        "total_likes":       total_likes,
        "total_comments":    total_comments,
        "total_impressions": total_impressions,
        "by_provider":       by_provider,
        "best_post": {
            "id":       best.id,
            "content":  best.content[:120] + "..." if best else None,
            "likes":    best.likes if best else 0,
            "posted_at": best.posted_at.isoformat() if best and best.posted_at else None,
        } if best else None,
        "recent_posts": [
            {
                "id":          p.id,
                "content":     p.content[:80] + "...",
                "likes":       p.likes,
                "comments":    p.comments,
                "impressions": p.impressions,
                "posted_at":   p.posted_at.isoformat() if p.posted_at else None,
                "topic":       p.topic,
            }
            for p in posts[:10]
        ],
    }


@router.patch("/{post_id}/engagement")
async def update_engagement(
    post_id: str,
    likes:       int = 0,
    comments:    int = 0,
    impressions: int = 0,
    user: User = Depends(get_current_user),
    db:   Session = Depends(get_db),
):
    """Manually update engagement numbers for a posted post.
    (LinkedIn's API only exposes this data to Marketing Developer Platform
    partners; for regular apps you update this manually or via a separate scraper.)"""
    post = db.query(Post).filter(
        Post.id      == post_id,
        Post.user_id == user.id,
    ).first()
    if not post:
        from fastapi import HTTPException
        raise HTTPException(404, "Post not found")

    post.likes       = likes
    post.comments    = comments
    post.impressions = impressions
    db.commit()
    return {"updated": True, "likes": likes, "comments": comments, "impressions": impressions}
