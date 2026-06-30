#!/bin/bash
# LinkedPilot AI — Quick Start (no Docker needed)
# This runs just the FastAPI backend with SQLite — enough to test
# real LinkedIn posting, AI generation, and the approval workflow.
# (The automation pipeline's recurring scheduler needs Redis + Celery —
#  see docker-compose.yml for that, or run Celery manually, see README.)

set -e

cd "$(dirname "$0")/backend"

if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copying .env.example -> .env"
  cp .env.example .env
  echo "👉 Edit backend/.env now and add your real API keys, then re-run this script."
  exit 1
fi

echo "📦 Installing dependencies..."
pip install -r requirements.txt --break-system-packages --quiet

echo "🚀 Starting LinkedPilot AI backend on http://localhost:8000"
echo "   API docs available at http://localhost:8000/docs"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
