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

## Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up / log in with GitHub.
2. Click **New → Web Service**.
3. Connect your GitHub repo.
4. Render will detect `render.yaml` automatically. If not, configure manually:
   - **Runtime**: Docker
   - **Dockerfile path**: `./backend/Dockerfile`
   - **Docker context**: `./backend`
5. Under **Environment Variables**, add all of the following:

   | Key | Value |
   |-----|-------|
   | `PORT` | `3001` |
   | `ALLOWED_ORIGINS` | *(fill in after Vercel deploy — see Step 4)* |
   | `GROQ_API_KEY` | *(optional — users can also enter keys in the UI)* |
   | `NVIDIA_API_KEY` | *(optional — users can also enter keys in the UI)* |
   | `GOOGLE_CLIENT_ID` | *(from Google Cloud Console — see Step 2a)* |
   | `GOOGLE_CLIENT_SECRET` | *(from Google Cloud Console — see Step 2a)* |
   | `JWT_SECRET` | *(random string — run `openssl rand -base64 32`)* |
   | `FRONTEND_URL` | *(your Vercel URL — fill in after Step 3)* |
   | `BACKEND_URL` | *(your Render service URL, e.g. `https://custom-chatgpt-backend.onrender.com`)* |
   | `FIREBASE_PROJECT_ID` | *(from Firebase Console — see Step 2b)* |
   | `FIREBASE_CLIENT_EMAIL` | *(from Firebase service account JSON — see Step 2b)* |
   | `FIREBASE_PRIVATE_KEY` | *(from Firebase service account JSON — paste with literal `\n`, see Step 2b)* |

6. Click **Deploy**. Wait for the build to succeed.
7. Copy the **public URL** (e.g. `https://custom-chatgpt-backend.onrender.com`). You'll need it for Steps 2a and 3.

> **Note:** Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds.

---

## Step 2a — Set Up Google OAuth (required for Long-term Memory login)

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create or select a project.
2. Navigate to **APIs & Services → Credentials**.
3. Click **Create Credentials → OAuth 2.0 Client ID**.
4. Set **Application type** to **Web application**.
5. Under **Authorized redirect URIs**, add your Render backend callback URL:
   ```
   https://custom-chatgpt-backend.onrender.com/api/auth/google/callback
   ```
   For local development also add:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
6. Click **Create**. Copy the **Client ID** and **Client Secret**.
7. In the Render dashboard, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to these values.

---

## Step 2b — Set Up Firebase Firestore (required for Long-term Memory persistence)

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project** (or select an existing one).
2. In the left sidebar, click **Build → Firestore Database → Create database**.
   - Choose **Production mode**.
   - Select a region (e.g. `asia-east1`).
3. Go to **Project Settings** (gear icon) → **Service accounts** tab.
4. Click **Generate new private key** → **Generate key**. A JSON file will download.
5. Open the JSON file and copy these three values into Render env vars:
   | Render key | JSON field |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `project_id` |
   | `FIREBASE_CLIENT_EMAIL` | `client_email` |
   | `FIREBASE_PRIVATE_KEY` | `private_key` (paste the full string including `-----BEGIN PRIVATE KEY-----` — Render stores `\n` literally, the backend handles this automatically) |

> **Security:** The service account JSON contains sensitive credentials — never commit it to git.

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
   | `VITE_API_URL` | Your Render backend URL (e.g. `https://custom-chatgpt-backend.onrender.com`) |
7. Click **Deploy**. Wait for the build to succeed.
8. Copy the **public URL** (e.g. `https://custom-chatgpt.vercel.app`).

---

## Step 4 — Connect Backend ↔ Frontend

After you have both URLs, update these Render env vars (Dashboard → Environment → Save Changes):

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | Your Vercel URL (e.g. `https://custom-chatgpt.vercel.app`) |
| `ALLOWED_ORIGINS` | Same Vercel URL |

Render will redeploy automatically after saving.

---

## Step 5 — Verify

1. Open your Vercel URL in a browser.
2. Click **登入 / Login** — you should be redirected to Google's consent screen.
3. After login you should return to the app with your name shown in the top bar.
4. Go to Settings → enter a Groq or NVIDIA API key → send a message.
5. After chatting, click 🧠 to extract memories — they should persist across page reloads.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Cannot GET /api/auth/google` | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` not set, or Render deployment failed | Check Render dashboard logs; verify env vars are saved |
| Login redirects to `undefined/?token=…` | `FRONTEND_URL` not set in Render | Add `FRONTEND_URL` in Render env vars |
| Login button does nothing / goes to Vercel 404 | `VITE_API_URL` not set in Vercel | Add `VITE_API_URL` in Vercel env vars and **redeploy** |
| `OAuth redirect_uri_mismatch` from Google | `BACKEND_URL` env var doesn't match Google Cloud Console URI | Make sure the Authorized redirect URI in Google Console matches `${BACKEND_URL}/api/auth/google/callback` exactly |
| Memory won't save / Firebase error | Firebase credentials missing or wrong | Check `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in Render |
| Render service crashes on startup | Missing or malformed env var | Check Render → Logs tab for the error message |

---

## Local Development

```bash
# Terminal 1 — backend
cd backend && cp .env.example .env   # fill in API keys
npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:3001` automatically.
`VITE_API_URL` should be empty (or unset) in local `.env` so relative paths are used.
