# Frontend (Vite + React)

## Prerequisites

- Node.js 18+
- Backend running on **the same URL** as `VITE_API_BASE_URL` (see below)

## Environment

Copy **`Frontend/.env.example`** to **`Frontend/.env`** and adjust:

- **Production / Vercel:** `VITE_API_BASE_URL=https://path-to-strength.onrender.com` (also set in the Vercel dashboard; values are baked in at build time).
- **Local API:** `VITE_API_BASE_URL=http://127.0.0.1:5000` so the dev UI talks to your machine.

Use the API origin **without** a trailing `/api`. Optional Peer Connect: `VITE_CHAUTARA_API_URL` (see root `DEPLOYMENT.md`).

## Install & dev server

```bash
cd Frontend
npm install
npm run dev
```

Open the URL Vite prints (this project is usually **`http://localhost:8080`** — see `vite.config.ts`).

## Login / signup

Auth calls `POST /api/auth/register` and `POST /api/auth/login` on the main API. **The backend must be running** and reachable at `VITE_API_BASE_URL`, or login/signup will fail (network error).

See the repo root or `Backend/README.md` for how to start the API on **port 5000**.
