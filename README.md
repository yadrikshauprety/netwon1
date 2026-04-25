# Path to Strength

A bilingual (English / नेपाली) web platform that supports Nepali women along legal, emotional, and practical dimensions: daily grounding choices, case awareness, peer connection, safety planning, legal literacy, NGO and therapist discovery, and an AI companion chat. The stack pairs a **React + Vite** frontend with a **FastAPI** backend and optional auxiliary services.

---

OUR LIVE WEBSITE:
https://path-to-strength.vercel.app/ 
Do Visit 😁

## Table of contents

1. [Features](#features)  
2. [Architecture](#architecture)  
3. [User journey (workflow)](#user-journey-workflow)  
4. [NGO journey (workflow)](#ngo-journey-workflow)  
5. [Backend API overview](#backend-api-overview)  
6. [Setup](#setup)  
7. [Running the application](#running-the-application)  
8. [Environment variables](#environment-variables)  
9. [Project structure](#project-structure)  
10. [Testing](#testing)  
11. [Team](#team)

**Deployment:** **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Render (API) + Vercel (frontend), env vars, CORS, production caveats.

---

## Features

### Public & authentication

- **Landing page** — Marketing / entry; links to sign-in.
- **Auth** — Email + password **login** and **signup** with two roles:
  - **User** — must select a **Nepal district** at registration.
  - **NGO** — partner accounts for coordination views.
- **JWT sessions** — Token stored client-side; `Authorization: Bearer` on protected calls.
- **Language toggle** — EN / नेपाली across the UI via `LanguageContext`.

### User dashboard (after login)

- **Mood gate** — Full-screen **color selection** to set a mood theme (CSS variables + transitions). Includes a **companion disclaimer** (EN/NE) and language toggle on that screen.
- **Wellness spectrum** — One-time (per session) choice among emotional paths (e.g. heavy, unsettled, alone, need support) to gently bias the default tab.
- **Today** — Daily “restoration” style interactions, progress, and journey-related UI tied to **`/api/auth/daily-restoration`**.
- **Case tracker** — Case-oriented views, timelines, and help content (legal process context).
- **Incident log** — Survivors can log incidents (type, description, priority, optional anonymity to NGO); data is stored in SQLite and visible to NGOs subject to filters.
- **Peer Connect** — Community-style feed (posts, comments, voice hints). Served by **`chautara_api`** routes on the **same** main API (`/api/chautara/...`). Optional **`VITE_CHAUTARA_API_URL`** overrides the base if you split Chautara out later.
- **Safety planning** — Practical safety-oriented guidance.
- **Legal rights** — Rights education in plain language (bilingual).
- **Therapist / NGO** — Directory-style connection to support resources.
- **Chat (companion)** — Conversational UI with **Groq**-backed completions via **`POST /chat/`**; optional **speech-to-text** via **`POST /stt/transcribe`** (Sarvam) for voice input.
- **Agency trail / behavioral hooks** — Frontend logic for engagement patterns; optional **Supabase** integration exists in `behavioralEngine.ts` for richer analytics (requires configured Supabase + auth alignment).

### NGO dashboard

- **Incident queue** — List and filter incidents (all / anonymous / registered; pending / resolved).
- **Stats** — Aggregated counts (pending, resolved, weekly activity, etc.).
- **Registered users list** — Intended to call **`GET /api/auth/users`** (NGO-only); ensure this route is implemented in your deployed `auth_routes` if the tab should populate.

### Main API extras (same FastAPI app as auth)

- **Legal assistant** — **`POST /api/legal-chat`** — RAG over PDFs in `Backend/data/laws` (when present) + Groq; falls back to `local_data.json`.
- **Chautara (in `main.py`)** — JSON-backed pebbles/diyas/stories and moderation-style **`POST /api/chautara/interact`** using Groq.

---

## Architecture

| Layer | Technology |
|--------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, React Router, TanStack Query |
| Main API | FastAPI, Uvicorn, Pydantic, SQLite (users + incidents), PyJWT, bcrypt |
| AI | Groq (chat + legal + moderation), optional Sarvam (STT) |
| Legal RAG | `pdfminer.six`, `scikit-learn`, `sentence-transformers` / `torch` (see [Setup](#setup)) |
| Optional | Supabase client (behavioral logging); Peer Connect lives in `chautara_api.py`, mounted by `main.py` |

Frontend **defaults** API base to **`https://path-to-strength.onrender.com`** (see `Frontend/src/lib/apiBase.ts`). For **local** FastAPI, set `VITE_API_BASE_URL=http://127.0.0.1:5000` in `Frontend/.env`. Vite **dev server** uses **port 8080** (`Frontend/vite.config.ts`).

---

## User journey (workflow)

1. Open **`/`** → read landing → **Login** / **Get started** → **`/auth`**.  
2. **Sign up** as user (district required) or NGO → receive JWT → redirect to **`/dashboard`** or **`/ngo-dashboard`**.  
3. **User:** **Mood gate** → pick a color (theme applied) → **Wellness spectrum** → pick a path → land on dashboard with sidebar.  
4. Use sidebar tabs: **Today**, **Case Tracker**, **Peer Connect**, **Safety**, **Legal Rights**, **Therapist / NGO**, **Chat**.  
5. **Incident log** (within case/help flows) submits to **`POST /api/incidents`**.  
6. **Chat** sends history + system prompt to **`POST /chat/`**; mic uses **`/stt/transcribe`** when enabled.  
7. **Logout** clears local session (navbar).

---

## NGO journey (workflow)

1. Register / login as **NGO** → **`/ngo-dashboard`**.  
2. Review **stats** and **incident list**; filter by audience and status.  
3. Update case workflow / status via incident APIs (as implemented in `incidentsApi.ts`).  
4. **Registered users** tab calls **`/api/auth/users`** — verify backend route exists for your branch.

---

## Backend API overview

Prefixes are relative to the API host (production: `https://path-to-strength.onrender.com`, local: `http://127.0.0.1:5000`).

| Area | Methods | Path (prefix) | Notes |
|------|---------|----------------|-------|
| Auth | POST | `/api/auth/register`, `/api/auth/login` | Returns `access_token` + `user` |
| Auth | GET | `/api/auth/me` | Bearer token |
| Daily restoration | GET, PUT | `/api/auth/daily-restoration` | Journey + daily step |
| Incidents | Various | `/api/incidents` | Survivor create; NGO list/stats/update |
| Chat | POST | `/chat/` | Groq OpenAI-compatible proxy |
| STT | POST | `/stt/transcribe` | Multipart audio; Sarvam |
| Legal chat | POST | `/api/legal-chat` | RAG + Groq |
| Health | GET | `/health` | Liveness |

Interactive docs: **`/docs`** on the same API host (e.g. local `http://127.0.0.1:5000/docs` or `https://path-to-strength.onrender.com/docs`).

**Peer Connect** uses **`/api/chautara/*`** on the main app (see `chautara_api.py`). **`VITE_CHAUTARA_API_URL`** only if you point the UI at a different host (`PeerConnect.tsx`).

---

## Setup

### Prerequisites

- **Node.js** 18+ and npm  
- **Python** 3.12+ (matches typical venv in repo)  
- **Groq API key** for chat and legal features  
- **Sarvam API key** if you use server-side transcription  
- Optional: **MongoDB** / other keys from `.env.example` if you extend the app  

### Backend

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

If **`main.py`** fails to import **`rag`** (legal PDF pipeline), install missing packages:

```bash
pip install pdfminer.six scikit-learn
```

Copy environment template and edit:

```bash
cp .env.example .env
```

SQLite files are created automatically:

- **`sahara_users.db`** — users and incidents (path set in `auth_routes.py`).

### Frontend

```bash
cd Frontend
npm install
```

Copy **`Frontend/.env.example`** to **`Frontend/.env`** and set keys (see [Environment variables](#environment-variables)). For **local** API only, use `VITE_API_BASE_URL=http://127.0.0.1:5000`.

---

## Running the application

### 1. Main API (required for auth, chat, STT, legal, incidents)

```bash
cd Backend
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

- Swagger: http://127.0.0.1:5000/docs  
- Use **`--port 5000`** so defaults match `VITE_API_BASE_URL`.

### 2. Frontend

```bash
cd Frontend
npm run dev
```

- Default UI: **http://localhost:8080** (see `vite.config.ts`).

### 3. Chautara / Peer Connect (same process as main API)

Peer Connect **`/api/chautara/feed`**, **`/post`**, **`/comment`** is included when you run the main API (step **1** above). No second server is required.

Optional — run **only** Chautara on port **5001** (e.g. debugging):

```bash
cd Backend && source venv/bin/activate && python chautara_api.py
```

### CORS notes

The main app configures CORS for local dev (including **localhost:8080** → **127.0.0.1:5000** and **Private Network Access** for Chrome). For extra origins (e.g. LAN IP), use **`FRONTEND_URL`**, **`CORS_ALLOW_ORIGINS`**, and **`CORS_ALLOW_LAN`** in **`Backend/.env`** as described in **`Backend/.env.example`**.

---

## Environment variables

### Backend (`.env` in `Backend/`)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Sign JWT access tokens |
| `GROQ_API_KEY` / `VITE_GROQ_API_KEY` | Groq API (several modules read one or the other) |
| `SARVAM_API_KEY` | Speech-to-text proxy |
| `FRONTEND_URL` | CORS allowlist helper |
| `CORS_ALLOW_ORIGINS` | Comma-separated extra origins |
| `CORS_ALLOW_LAN` | `1` / `true` — regex allow private LAN dev origins |
| `MONGODB_URI`, Firebase keys, SMTP | Optional / future integrations per `.env.example` |

### Frontend (`Frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Main FastAPI origin without trailing slash (default in code: `https://path-to-strength.onrender.com`; local: `http://127.0.0.1:5000`) |
| `VITE_BACKEND_URL` | Fallback; may include `/api` — stripped by `getMainApiBase()` |
| `VITE_CHAUTARA_API_URL` | Optional override for Peer Connect; default is same origin as `VITE_API_BASE_URL` + `/api/chautara` |
| `VITE_GROQ_API_KEY` | Only if used client-side (prefer server-side for secrets) |
| `VITE_SUPABASE_*` | Optional behavioral / Supabase features |

Never commit real **`.env`** files with secrets.

---

## Project structure

```
path-to-strength/
├── Backend/
│   ├── main.py              # FastAPI app, CORS, legal-chat, chautara JSON routes, routers
│   ├── auth_routes.py       # Register, login, me, daily-restoration
│   ├── incident_routes.py   # Incidents CRUD / NGO views
│   ├── chat.py              # Groq chat proxy
│   ├── speech_to_text.py    # Sarvam STT
│   ├── rag.py               # Legal PDF RAG helpers
│   ├── chautara_api.py      # Peer Connect router (mounted in main.py; optional `python chautara_api.py` → :5001)
│   ├── requirements.txt
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── App.tsx          # Routes
│   │   ├── pages/           # Landing, Auth, UserDashboard, NgoDashboard, NotFound
│   │   ├── components/      # Navbar, dashboard/*, UI kit
│   │   ├── contexts/        # Auth, Language
│   │   └── lib/             # apiBase, incidentsApi, restorationApi, moodTheme, …
│   ├── vite.config.ts
│   └── package.json
└── README.md                # This file
```

---

## Testing

```bash
cd Frontend
npm run test        # Vitest
npm run lint        # ESLint
```

Playwright is listed in devDependencies; use your existing `playwright.config.ts` when e2e tests are added.

---

## Team

**Team members**

- Prishika Chaudhary  
- Pema Tshering Sherpa  
- Yadriksha Uprety  
- Sujit Lopchan  
- Bikash Kumar Yadav  

**Mentor**

- Suman Koju  

---

*This README reflects the repository layout and behavior at the time of writing. If you add routes (e.g. `GET /api/auth/users`) or change ports, update this document and `Backend/.env.example` / `Frontend/README.md` accordingly.*
