import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.database import init_db
from routers import (
    auth, linkedin, posts, content,
    automation, manual_post, research,
    settings as settings_router, analytics, excel_import,
)

app = FastAPI(
    title="LinkedPilot AI API",
    version="2.0.0",
    description="Complete LinkedIn automation backend — OAuth, AI generation, scheduling, approval workflow.",
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()
    print("✅ LinkedPilot AI backend started")
    print("✅ Database initialised")
    print(f"   Docs → http://localhost:8000/docs")


# ── Health check (used by Docker, Railway, Render etc.) ──────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/")
async def root():
    return {
        "status":  "LinkedPilot AI API v2.0 running",
        "docs":    "/docs",
        "health":  "/health",
    }


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,               prefix="/api/auth",       tags=["Auth"])
app.include_router(linkedin.router,           prefix="/api/linkedin",   tags=["LinkedIn"])
app.include_router(posts.router,              prefix="/api/posts",      tags=["Posts"])
app.include_router(content.router,            prefix="/api/content",    tags=["Generate"])
app.include_router(automation.router,         prefix="/api/automation", tags=["Automation"])
app.include_router(manual_post.router,        prefix="/api/manual",     tags=["Manual Post"])
app.include_router(research.router,           prefix="/api/research",   tags=["Research"])
app.include_router(settings_router.router,    prefix="/api/settings",   tags=["Settings"])
app.include_router(analytics.router,          prefix="/api/analytics",  tags=["Analytics"])
app.include_router(excel_import.router,       prefix="/api/import",     tags=["Import"])
