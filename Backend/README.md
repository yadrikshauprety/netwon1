# Backend (FastAPI)

## Setup

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Optional: copy `.env` and set `JWT_SECRET`, `GROQ_API_KEY`, etc.

## Run the API (required for login/signup)

The frontend **defaults** to the deployed API **`https://path-to-strength.onrender.com`** when `VITE_API_BASE_URL` is unset (`Frontend/src/lib/apiBase.ts`). For **local** development against this repo, set **`VITE_API_BASE_URL=http://127.0.0.1:5000`** in `Frontend/.env`.

**Option A — recommended (matches frontend default):**

```bash
cd Backend
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

**Option B:**

```bash
python main.py
```

(This also binds to port **5000**.)

> **Do not** use `uvicorn main:app --reload` without `--port 5000` — the default is **8000**, and the app will not match the frontend unless you set `VITE_API_BASE_URL=http://127.0.0.1:8000`.

## Check it’s up

- Open `http://127.0.0.1:5000/docs` — Swagger UI should load.
- Register/login from the frontend should hit `http://127.0.0.1:5000/api/auth/register` and `/api/auth/login`.

## Auth database

Users (and incidents) use SQLite at `Backend/sahara_users.db` by default (`auth_routes.py` / `incident_routes.py`), created on first run.
