# LinkedPilot AI — Deployment Guide

## Option 1: Local Testing (Fastest — 5 minutes)

```bash
cd linkedpilot-final/backend
cp .env.example .env
# Fill in your real keys in .env
cd ..
./run.sh
```
Visit `http://localhost:8000/docs` — test every endpoint via Swagger UI.

---

## Option 2: Full Stack with Docker (Recommended for Production)

### Prerequisites
- Docker + Docker Compose installed
- A domain name (optional but recommended)

### Steps

```bash
cd linkedpilot-final

# 1. Create your .env file
cp backend/.env.example backend/.env
# Edit backend/.env — fill in all your real API keys

# 2. Generate a strong JWT secret
python3 -c "import secrets; print(secrets.token_hex(32))"
# Paste the output as JWT_SECRET in backend/.env

# 3. Set a strong Postgres password in backend/.env
#    POSTGRES_PASSWORD=your-strong-password
#    Also update DATABASE_URL to use the same password

# 4. Start everything
docker-compose up --build -d

# 5. Check it's running
docker-compose ps
curl http://localhost/health
```

All services start automatically:
- **Backend API** → `http://localhost:8000` (or via Nginx at `http://localhost`)
- **API Docs** → `http://localhost/docs`
- **PostgreSQL** → internal (port 5432 exposed for local DB tools)
- **Redis** → internal
- **Celery worker** → processes tasks in background
- **Celery beat** → runs automation pipeline + scheduled posts every 5min/1hr

### Update LinkedIn App redirect URL for production
In your LinkedIn Developer App → Auth tab, add:
```
http://yourdomain.com/api/linkedin/callback
```
Update `LINKEDIN_REDIRECT_URI` and `FRONTEND_URL` in `.env` to match.

---

## Option 3: Deploy on Railway (Free tier available)

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add a **PostgreSQL** service (Railway provides free Postgres)
4. Add a **Redis** service
5. In your backend service, set these **environment variables** (from the Railway UI):
   ```
   DATABASE_URL      ← copy from Railway's Postgres service
   REDIS_URL         ← copy from Railway's Redis service
   JWT_SECRET        ← generate: python -c "import secrets; print(secrets.token_hex(32))"
   LINKEDIN_CLIENT_ID
   LINKEDIN_CLIENT_SECRET
   LINKEDIN_REDIRECT_URI  ← https://your-app.railway.app/api/linkedin/callback
   FRONTEND_URL           ← https://your-app.railway.app
   ANTHROPIC_API_KEY
   OPENAI_API_KEY
   ```
6. Set the **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Set the **Root Directory**: `backend`
8. Deploy → Railway builds and runs automatically

For Celery (automation scheduling), add a **second service** in the same project:
- Root Directory: `backend`
- Start Command: `celery -A celery_app worker -B --loglevel=info`
- Same environment variables as above

---

## Option 4: Deploy on Render (Free tier available)

1. Create account at [render.com](https://render.com)
2. New → **Web Service** → connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add a **PostgreSQL** database (Render provides free Postgres)
5. Add a **Redis** instance
6. Set all environment variables (same as Railway above)
7. For Celery: create a second **Background Worker** service with:
   - Start Command: `celery -A celery_app worker -B --loglevel=info`

---

## Option 5: VPS / Ubuntu Server (DigitalOcean, Linode, AWS EC2)

```bash
# On your server
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Clone your repo
git clone https://github.com/yourusername/linkedpilot.git
cd linkedpilot

# Setup env
cp backend/.env.example backend/.env
nano backend/.env  # fill in your real values

# Start
docker-compose up --build -d

# Auto-start on reboot
sudo systemctl enable docker
```

### Adding HTTPS with Let's Encrypt
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com

# Copy certs to nginx folder
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/

# Uncomment the HTTPS server block in nginx/nginx.conf
# Then restart nginx
docker-compose restart nginx
```

---

## After Deployment — LinkedIn App Setup

1. Go to [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)
2. Select your app → **Auth** tab
3. Add the Redirect URL: `https://yourdomain.com/api/linkedin/callback`
4. Under **Products**, make sure these are approved:
   - ✅ Sign In with LinkedIn using OpenID Connect
   - ✅ Share on LinkedIn
5. Copy **Client ID** and **Client Secret** into your `.env`

---

## Monitoring

```bash
# View live logs
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f celery_beat

# Check health
curl https://yourdomain.com/health

# Restart a service
docker-compose restart backend

# Update after code changes
git pull
docker-compose up --build -d
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | SQLite or PostgreSQL connection string |
| `REDIS_URL` | ✅* | Redis URL (*only for scheduling/Celery) |
| `JWT_SECRET` | ✅ | Random 32+ char secret for JWT signing |
| `LINKEDIN_CLIENT_ID` | ✅ | From LinkedIn Developer App |
| `LINKEDIN_CLIENT_SECRET` | ✅ | From LinkedIn Developer App |
| `LINKEDIN_REDIRECT_URI` | ✅ | Must match exactly in LinkedIn App settings |
| `FRONTEND_URL` | ✅ | Where LinkedIn redirects after OAuth |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key (default AI engine) |
| `OPENAI_API_KEY` | ⬜ | For GPT-4o text + DALL-E 3 images |
| `GEMINI_API_KEY` | ⬜ | For Gemini Pro text generation |
| `POSTGRES_PASSWORD` | ⬜ | Only needed for docker-compose Postgres |
