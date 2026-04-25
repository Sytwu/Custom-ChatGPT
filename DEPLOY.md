# Deployment Guide — Vercel (Frontend) + Render (Backend)

## Architecture

```
GitHub repo (main branch)
  ├── frontend/   →  Vercel  (static React build, auto-deploy on push)
  └── backend/    →  Render  (Node.js Docker service, auto-deploy on push)
```

Both platforms connect directly to GitHub and redeploy automatically when you push to `main`. No GitHub Actions needed.

---

## Step 1 — Push the repo to GitHub

```bash
git init          # if not already a git repo
git add .
git commit -m "initial commit"
gh repo create custom-chatgpt --public --push
# or: git remote add origin https://github.com/YOUR_USERNAME/custom-chatgpt.git && git push -u origin main
```

> Make sure `backend/.env` is in `.gitignore` (it already is) — never commit real API keys.

---

## Step 2a — Set Up Google OAuth (for Long-term Memory)

> Skip this step if you don't need the long-term memory feature.

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create or select a project.
2. Navigate to **APIs & Services → Credentials**.
3. Click **Create Credentials → OAuth 2.0 Client ID**.
4. Set **Application type** to **Web application**.
5. Under **Authorized redirect URIs**, add:
   ```
   https://custom-chatgpt-backend.onrender.com/api/auth/google/callback
   ```
   *(Replace with your actual Render backend URL from Step 2)*
6. For local development, also add:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
7. Click **Create**. Copy the **Client ID** and **Client Secret**.
8. Set these as environment variables in Render (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
9. After deploying the frontend (Step 3), set `FRONTEND_URL` in Render to your Vercel URL.

> **Note:** Memory data is stored in the container's local filesystem (`backend/data/memories/`). On Render's free tier, this resets on every deploy. For persistence, upgrade to a Render Disk or migrate to an external database.

---

## Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up / log in with GitHub.
2. Click **New → Web Service**.
3. Connect your GitHub repo.
4. Render will detect `render.yaml` automatically. If not, configure manually:
   - **Runtime**: Docker
   - **Dockerfile path**: `./backend/Dockerfile`
   - **Docker context**: `./backend`
5. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `PORT` | `3001` |
   | `ALLOWED_ORIGINS` | *(fill in after Vercel deploy — see Step 4)* |
   | `GROQ_API_KEY` | *(optional — users can enter keys in the UI)* |
   | `NVIDIA_API_KEY` | *(optional — users can enter keys in the UI)* |
   | `GOOGLE_CLIENT_ID` | *(from Google Cloud Console — see Step 2a)* |
   | `GOOGLE_CLIENT_SECRET` | *(from Google Cloud Console — see Step 2a)* |
   | `JWT_SECRET` | *(random string — run `openssl rand -base64 32`)* |
   | `FRONTEND_URL` | *(your Vercel URL — fill in after Step 3)* |
6. Click **Deploy**. Wait for the build to succeed.
7. Copy the **public URL** (e.g. `https://custom-chatgpt-backend.onrender.com`).

> **Note:** Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to a paid plan for always-on.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in with GitHub.
2. Click **Add New → Project**.
3. Import your GitHub repo.
4. Set the **Root Directory** to `frontend`.
5. Vercel will detect `vercel.json` automatically. Build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://custom-chatgpt-backend.onrender.com` ← your Render URL from Step 2 |
7. Click **Deploy**. Wait for the build to succeed.
8. Copy the **public URL** (e.g. `https://custom-chatgpt.vercel.app`).

---

## Step 4 — Connect CORS (Backend ↔ Frontend)

1. Go back to Render → your backend service → **Environment**.
2. Set `ALLOWED_ORIGINS` to your Vercel URL:
   ```
   https://custom-chatgpt.vercel.app
   ```
3. Click **Save Changes** — Render will redeploy automatically.

---

## Step 5 — Verify

1. Open your Vercel URL in a browser.
2. Go to Settings (right sidebar) → enter a Groq or NVIDIA API key.
3. Send a message — you should get a streaming response.
4. Check the browser Network tab to confirm requests go to your Render backend URL.

---

## Local Development (unchanged)

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:3001` automatically.
`VITE_API_URL` is empty in dev so relative paths are used.

---

## Auto-Deploy on Push

Both Vercel and Render watch your GitHub `main` branch. Every `git push` triggers a new deploy automatically — no extra CI/CD configuration needed.

If you want to protect `main` and deploy only from PRs, configure branch protection rules in GitHub Settings → Branches.
