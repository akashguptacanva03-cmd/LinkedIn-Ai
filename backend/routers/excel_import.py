import csv
import io
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db
from models.models import User, Post
from routers.auth import get_current_user

router = APIRouter()


@router.post("/import")
async def import_csv(
    file:  UploadFile = File(...),
    user:  User       = Depends(get_current_user),
    db:    Session    = Depends(get_db),
):
    """
    Import posts from a CSV file. Columns:
      content   (required)  — post text
      topic     (optional)
      tone      (optional)  — Professional, Casual, etc.
      image_url (optional)

    Returns the number of posts imported as drafts.
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(400, "Only .csv files are supported")

    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")  # handles BOM from Excel exports
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader  = csv.DictReader(io.StringIO(text))
    created : List[str] = []
    errors  : List[str] = []

    for i, row in enumerate(reader, start=2):
        content = (row.get("content") or row.get("Content") or "").strip()
        if not content:
            errors.append(f"Row {i}: missing content — skipped")
            continue
        if len(content) > 3000:
            errors.append(f"Row {i}: content exceeds 3000 chars — skipped")
            continue

        post = Post(
            user_id    = user.id,
            content    = content,
            topic      = (row.get("topic")     or row.get("Topic")     or "").strip(),
            tone       = (row.get("tone")      or row.get("Tone")      or "Professional").strip(),
            image_url  = (row.get("image_url") or row.get("Image URL") or "").strip(),
            status     = "draft",
            ai_provider = "import",
        )
        db.add(post)
        created.append(f"Row {i}")

    db.commit()
    return {
        "imported": len(created),
        "skipped":  len(errors),
        "errors":   errors[:20],  # cap error list
    }


@router.get("/template")
async def csv_template():
    """Return a sample CSV template the user can fill and re-upload."""
    sample = (
        "content,topic,tone,image_url\n"
        '"🚀 AI is transforming how we work. Here are 3 things every professional should know... #AI #FutureOfWork",AI productivity,Professional,\n'
        '"Leadership is not about authority — it is about impact. Agree? #Leadership",Leadership,Inspirational,\n'
    )
    from fastapi.responses import Response
    return Response(
        content=sample,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=linkedpilot_import_template.csv"},
    )
