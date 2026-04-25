"""SQLite-backed auth: users stored in sahara_users.db (open in SQLite extension)."""
import os
import sqlite3
import time
import uuid
from typing import Annotated

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sahara_users.db")

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALG = "HS256"
JWT_EXPIRE_HOURS = 168  # 7 days

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


def _conn():
    return sqlite3.connect(DB_PATH)


def _migrate_user_restoration_columns():
    conn = _conn()
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(users)")
    cols = {row[1] for row in cur.fetchall()}
    if "journey_start_ms" not in cols:
        cur.execute("ALTER TABLE users ADD COLUMN journey_start_ms INTEGER")
    if "daily_restoration_date" not in cols:
        cur.execute("ALTER TABLE users ADD COLUMN daily_restoration_date TEXT")
    if "daily_restoration_step" not in cols:
        cur.execute("ALTER TABLE users ADD COLUMN daily_restoration_step INTEGER DEFAULT 0")
    conn.commit()
    conn.close()


def init_users_db():
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash BLOB NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'ngo')),
            district TEXT,
            created_at REAL NOT NULL,
            last_login_at REAL
        )
        """
    )
    conn.commit()
    conn.close()
    _migrate_user_restoration_columns()


class RegisterBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=200)
    role: str = Field(..., pattern="^(user|ngo)$")
    district: str | None = Field(None, max_length=80)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=200)


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str
    district: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class DailyRestorationOut(BaseModel):
    """Daily Restoration (Today's 5 Choices) + journey anchor for day/tier counts."""

    journey_start_ms: int
    daily_restoration_date: str | None = None
    daily_restoration_step: int = 0


class DailyRestorationUpdate(BaseModel):
    journey_start_ms: int | None = None
    daily_restoration_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    daily_restoration_step: int = Field(..., ge=0, le=5)


def _hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())


def _verify_password(password: str, password_hash: bytes) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash)


def _make_token(user_id: str, email: str, role: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def _row_to_public(row: sqlite3.Row) -> UserPublic:
    return UserPublic(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        role=row["role"],
        district=row["district"],
    )


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> UserPublic:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT id, email, name, role, district FROM users WHERE id = ?",
        (uid,),
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    return _row_to_public(row)


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterBody):
    if body.role == "user" and not (body.district and body.district.strip()):
        raise HTTPException(
            status_code=400,
            detail="District is required for user accounts.",
        )
    uid = str(uuid.uuid4())
    pw_hash = _hash_password(body.password)
    now = time.time()
    district = body.district.strip() if body.district else None

    journey_ms = int(time.time() * 1000)
    conn = _conn()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO users (
                id, email, password_hash, name, role, district, created_at, last_login_at,
                journey_start_ms, daily_restoration_date, daily_restoration_step
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)
            """,
            (
                uid,
                str(body.email).lower(),
                pw_hash,
                body.name.strip(),
                body.role,
                district,
                now,
                now,
                journey_ms,
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    conn.close()

    token = _make_token(uid, str(body.email).lower(), body.role)
    user = UserPublic(
        id=uid,
        email=str(body.email).lower(),
        name=body.name.strip(),
        role=body.role,
        district=district,
    )
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody):
    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT id, email, password_hash, name, role, district FROM users WHERE email = ? COLLATE NOCASE",
        (str(body.email).lower(),),
    )
    row = cur.fetchone()
    if not row or not _verify_password(body.password, row["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    uid = row["id"]
    now = time.time()
    cur.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now, uid))
    conn.commit()
    conn.close()

    token = _make_token(uid, row["email"], row["role"])
    user = _row_to_public(row)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserPublic)
async def me(user: Annotated[UserPublic, Depends(get_current_user)]):
    return user


@router.get("/daily-restoration", response_model=DailyRestorationOut)
async def get_daily_restoration(user: Annotated[UserPublic, Depends(get_current_user)]):
    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT journey_start_ms, daily_restoration_date, daily_restoration_step FROM users WHERE id = ?",
        (user.id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    j = row["journey_start_ms"]
    if j is None:
        j = int(time.time() * 1000)
        cur.execute("UPDATE users SET journey_start_ms = ? WHERE id = ?", (j, user.id))
        conn.commit()
    out = DailyRestorationOut(
        journey_start_ms=int(j),
        daily_restoration_date=row["daily_restoration_date"],
        daily_restoration_step=int(row["daily_restoration_step"] or 0),
    )
    conn.close()
    return out


@router.put("/daily-restoration", response_model=DailyRestorationOut)
async def put_daily_restoration(
    body: DailyRestorationUpdate,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT journey_start_ms FROM users WHERE id = ?",
        (user.id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    j = row["journey_start_ms"]
    if body.journey_start_ms is not None:
        j = body.journey_start_ms
    elif j is None:
        j = int(time.time() * 1000)
    cur.execute(
        """
        UPDATE users SET journey_start_ms = ?, daily_restoration_date = ?, daily_restoration_step = ?
        WHERE id = ?
        """,
        (j, body.daily_restoration_date, body.daily_restoration_step, user.id),
    )
    conn.commit()
    conn.close()
    return DailyRestorationOut(
        journey_start_ms=int(j),
        daily_restoration_date=body.daily_restoration_date,
        daily_restoration_step=body.daily_restoration_step,
    )
