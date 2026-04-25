# Deploying Path to Strength — Render (API) + Vercel (frontend)

This guide covers deploying the **FastAPI backend** to **[Render](https://render.com)** and the **Vite + React frontend** to **[Vercel](https://vercel.com)**.

---

## 1. Before you start

| Item | Notes |
|------|--------|
| **Order** | Deploy the **backend first**, copy its public URL, then set the frontend `VITE_API_BASE_URL` to that URL. |
| **HTTPS** | Production origins must be `https://...`. Add your Vercel URL to backend CORS (see §4). |
| **Secrets** | Never commit `.env`. Set variables in Render / Vercel dashboards only. |
| **SQLite on Render** | The default filesystem on Render **Web Services is ephemeral**: `sahara_users.db` can be **wiped on redeploy or restart**. For real users, plan **PostgreSQL** (Render Postgres) or a **persistent disk** — see §6. |
| **Heavy Python deps** | `torch` + `sentence-transformers` (legal RAG) make the **slug large** and **cold starts slow**. Free tier may hit limits; consider a **paid instance** or a slimmer `requirements-prod.txt` without RAG if you only need auth + chat. |

---

## 2. Backend on Render

### 2.1 Create a Web Service

1. In Render: **New → Web Service**.
2. Connect your GitHub repo **path-to-strength**.
3. Configure:

| Setting | Value |
|--------|--------|
| **Root directory** | `Backend` |
| **Runtime** | `Python 3` |
| **Build command** | `pip install -r requirements.txt && pip install pdfminer.six scikit-learn` |
| **Start command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Render injects **`PORT`** automatically — do **not** hardcode `5000` in production.

### 2.2 Optional: pin Python version

In the `Backend/` folder, add `runtime.txt` (one line), e.g.:

```text
python-3.12.0
```

(Render’s docs list supported versions; adjust if needed.)

### 2.3 Health check (recommended)

In the service settings, set **Health Check Path** to:

```text
/health
```

### 2.4 Environment variables (Render)

Add these in **Environment** for the Web Service:

| Variable | Required | Example / notes |
|----------|----------|------------------|
| `JWT_SECRET` | **Yes** | Long random string (signing tokens). |
| `GROQ_API_KEY` | **Yes** (for chat + legal + chautara moderation) | From [Groq Console](https://console.groq.com). |
| `FRONTEND_URL` | **Yes** (for CORS) | Your Vercel URL, e.g. `https://your-app.vercel.app` (no trailing slash). |
| `CORS_ALLOW_ORIGINS` | If you have **extra** origins | Comma-separated, e.g. `https://www.yourdomain.com,https://preview-xxx.vercel.app` |
| `SARVAM_API_KEY` | If you use **STT** | For `/stt/transcribe`. |
| `CORS_ALLOW_LAN` | **No** in production | Omit or `0` — LAN regex is for local dev only. |

Optional (from your `.env.example` if you use them):

- `MONGODB_URI`, Firebase, SMTP, etc.

**Note:** `load_dotenv()` in `main.py` is fine locally; on Render, **dashboard env vars** are what matter.

### 2.5 After deploy

- Open `https://path-to-strength.onrender.com/docs` — Swagger should load.
- Test `GET https://path-to-strength.onrender.com/health` → `{"status":"ok"}`.

Copy the **exact** service URL (including `https://`) for Vercel.

### 2.6 Cold starts (free tier)

Free Web Services **spin down** when idle. First request after idle can take **30–60+ seconds**. For demos, upgrade to a **paid** instance or use a **cron** ping (external) if allowed by your policy.

---

## 3. Frontend on Vercel

### 3.1 New project

1. **Vercel → Add New → Project** → import the same GitHub repo.
2. Configure:

| Setting | Value |
|--------|--------|
| **Framework preset** | Vite (auto-detected) |
| **Root directory** | `Frontend` |
| **Build command** | `npm run build` (default) |
| **Output directory** | `dist` (Vite default) |
| **Install command** | `npm install` |

### 3.2 Environment variables (Vercel)

In **Project → Settings → Environment Variables** (Production + Preview if you want previews to hit a staging API):

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://path-to-strength.onrender.com` (no trailing slash) |

**Important:** `VITE_*` variables are baked in at **build time**. After changing them, **redeploy** the Vercel project.

Do **not** put `GROQ_API_KEY` in the frontend unless you accept exposing it in the client bundle. Chat and legal flows should go through the **backend** (already the case for `/chat/`).

### 3.3 SPA routing

React Router uses client-side routes (`/dashboard`, `/auth`, …). Vercel should rewrite unknown paths to `index.html`:

- Usually automatic for Vite templates; if `/dashboard` 404s on refresh, add **`vercel.json`** in **`Frontend/`**:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 4. CORS (production)

The API uses **explicit origins** + `allow_credentials=True`. Your **Vercel deployment URL** must be allowed.

1. Set **`FRONTEND_URL`** on Render to your primary site, e.g. `https://your-app.vercel.app`.
2. For **preview deployments** (`*.vercel.app` with random names), either:
   - add each preview URL to **`CORS_ALLOW_ORIGINS`**, or  
   - use a **stable preview** subdomain / custom domain and point previews there.

`allow_private_network=True` in code is mainly for **local** Chrome PNA; production HTTPS → HTTPS API does not rely on it.

---

## 5. Peer Connect (Chautara)

**Peer Connect** is part of the **same** FastAPI app as everything else: routes under **`/api/chautara/*`** come from `chautara_api.py`, which **`main.py` mounts**. Your Render **start command stays** `uvicorn main:app --host 0.0.0.0 --port $PORT` — no second service.

`PeerConnect.tsx` calls **`{API base}/api/chautara/...`**, matching the main API. Set **`VITE_CHAUTARA_API_URL`** only if you intentionally host Chautara on another origin later.

---

## 6. SQLite vs PostgreSQL (important)

Current auth and incidents use **`sahara_users.db`** next to the app. On Render:

- **Ephemeral disk** → users/incidents **lost** on redeploy/restart.
- **Persistent disk** (paid) → mount a path and point `DB_PATH` via code/env (requires a small refactor in `auth_routes.py` / `incident_routes.py`).

**Recommended for production:** **Render PostgreSQL** + migrate users/incidents off SQLite (larger change).

---

## 7. Legal RAG (`rag.py`)

- Needs **`pdfminer.six`**, **`scikit-learn`**, and PDFs under `Backend/data/laws/` (commit them or upload in build).
- **`torch`** + **`sentence-transformers`** increase image size and boot time. If deploy fails or times out, split **minimal** `requirements.txt` for Render (no torch) and disable or lazy-load RAG.

---

## 8. Checklist

- [ ] Render Web Service: build + start commands, `PORT`, `/health`.
- [ ] Render env: `JWT_SECRET`, `GROQ_API_KEY`, `FRONTEND_URL` (+ optional `CORS_ALLOW_ORIGINS`, `SARVAM_API_KEY`).
- [ ] Vercel: root `Frontend`, `VITE_API_BASE_URL` = Render URL.
- [ ] Redeploy Vercel after env changes.
- [ ] Browser: open Vercel site → register/login → Network tab confirms API calls go to Render and return **200** (not CORS errors).
- [ ] Plan **database persistence** before real users (§6).

---

## 9. Quick reference URLs

| Environment | Frontend | API docs |
|-------------|----------|----------|
| Local | `http://localhost:8080` | `http://127.0.0.1:5000/docs` |
| Production | `https://<project>.vercel.app` | `https://path-to-strength.onrender.com/docs` |

---

*Peer Connect shares the main service; optional standalone `python chautara_api.py` uses `PORT` (default 5001) for local debugging.*
