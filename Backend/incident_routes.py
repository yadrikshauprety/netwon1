"""Incident / case log: survivors POST entries; NGO GET aggregated list (same SQLite DB as auth)."""
import sqlite3
import time
import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth_routes import DB_PATH, UserPublic, get_current_user

router = APIRouter(prefix="/incidents", tags=["incidents"])

ALLOWED_TYPES = frozenset({"court_delay", "police_dismissal", "threat", "other"})
ALLOWED_PRIORITY = frozenset({"low", "medium", "high"})
ALLOWED_STATUS = frozenset({"pending", "resolved"})
ALLOWED_PROGRESS = frozenset(
    {
        "received",
        "triaging",
        "assigned",
        "in_progress",
        "awaiting_survivor",
        "closed",
    }
)


def _conn():
    return sqlite3.connect(DB_PATH)


def _migrate_incidents_columns(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(incidents)")
    cols = {row[1] for row in cur.fetchall()}
    if "status" not in cols:
        cur.execute(
            "ALTER TABLE incidents ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'"
        )
    if "resolved_at" not in cols:
        cur.execute("ALTER TABLE incidents ADD COLUMN resolved_at REAL")
    if "assigned_to" not in cols:
        cur.execute("ALTER TABLE incidents ADD COLUMN assigned_to TEXT")
    if "assigned_unit" not in cols:
        cur.execute("ALTER TABLE incidents ADD COLUMN assigned_unit TEXT")
    if "progress_state" not in cols:
        cur.execute(
            "ALTER TABLE incidents ADD COLUMN progress_state TEXT NOT NULL DEFAULT 'received'"
        )
    if "progress_updated_at" not in cols:
        cur.execute("ALTER TABLE incidents ADD COLUMN progress_updated_at REAL")
    conn.commit()


def init_incidents_db():
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            incident_type TEXT NOT NULL,
            description TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
            anonymous_to_ngo INTEGER NOT NULL DEFAULT 0,
            created_at REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            resolved_at REAL,
            assigned_to TEXT,
            assigned_unit TEXT,
            progress_state TEXT NOT NULL DEFAULT 'received',
            progress_updated_at REAL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )
    _migrate_incidents_columns(conn)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)")
    conn.commit()
    conn.close()


class IncidentCreate(BaseModel):
    incident_type: str = Field(..., min_length=1, max_length=64)
    description: str = Field(..., min_length=1, max_length=8000)
    priority: Literal["low", "medium", "high"] = "medium"
    anonymous_to_ngo: bool = False


class IncidentOut(BaseModel):
    id: str
    incident_type: str
    description: str
    priority: str
    anonymous_to_ngo: bool
    created_at: float
    status: Literal["pending", "resolved"] = "pending"
    resolved_at: float | None = None
    assigned_to: str | None = None
    assigned_unit: str | None = None
    progress_state: str = "received"
    progress_updated_at: float | None = None
    # NGO list: how to show reporter
    reporter_display_name: str | None = None
    reporter_kind: Literal["anonymous", "registered"] | None = None


def _row_status(row: sqlite3.Row) -> str:
    try:
        s = row["status"]
    except (KeyError, IndexError, TypeError):
        return "pending"
    return s if s in ALLOWED_STATUS else "pending"


def _row_resolved_at(row: sqlite3.Row) -> float | None:
    try:
        v = row["resolved_at"]
    except (KeyError, IndexError, TypeError):
        return None
    return float(v) if v is not None else None


def _row_assigned_to(row: sqlite3.Row) -> str | None:
    try:
        v = row["assigned_to"]
    except (KeyError, IndexError, TypeError):
        return None
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    return str(v).strip() if v else None


def _row_assigned_unit(row: sqlite3.Row) -> str | None:
    try:
        v = row["assigned_unit"]
    except (KeyError, IndexError, TypeError):
        return None
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    return str(v).strip() if v else None


def _row_progress_state(row: sqlite3.Row) -> str:
    try:
        p = row["progress_state"]
    except (KeyError, IndexError, TypeError):
        return "received"
    return p if p in ALLOWED_PROGRESS else "received"


def _row_progress_updated_at(row: sqlite3.Row) -> float | None:
    try:
        v = row["progress_updated_at"]
    except (KeyError, IndexError, TypeError):
        return None
    return float(v) if v is not None else None


def _row_incident_out(
    row: sqlite3.Row,
    *,
    user_name: str | None,
    for_ngo: bool,
) -> IncidentOut:
    anon = bool(row["anonymous_to_ngo"])
    rid = row["user_id"]
    st = _row_status(row)
    ra = _row_resolved_at(row)
    at = _row_assigned_to(row)
    au = _row_assigned_unit(row)
    ps = _row_progress_state(row)
    pu = _row_progress_updated_at(row)
    if for_ngo:
        if anon:
            short = str(rid).replace("-", "")[:4].upper()
            label = f"Anonymous #{short}"
            kind: Literal["anonymous", "registered"] = "anonymous"
        else:
            label = user_name or "User"
            kind = "registered"
        return IncidentOut(
            id=row["id"],
            incident_type=row["incident_type"],
            description=row["description"],
            priority=row["priority"],
            anonymous_to_ngo=anon,
            created_at=float(row["created_at"]),
            status=st,  # type: ignore[arg-type]
            resolved_at=ra,
            assigned_to=at,
            assigned_unit=au,
            progress_state=ps,
            progress_updated_at=pu,
            reporter_display_name=label,
            reporter_kind=kind,
        )
    return IncidentOut(
        id=row["id"],
        incident_type=row["incident_type"],
        description=row["description"],
        priority=row["priority"],
        anonymous_to_ngo=anon,
        created_at=float(row["created_at"]),
        status=st,  # type: ignore[arg-type]
        resolved_at=ra,
        assigned_to=at,
        assigned_unit=au,
        progress_state=ps,
        progress_updated_at=pu,
        reporter_display_name=None,
        reporter_kind=None,
    )


@router.post("", response_model=IncidentOut)
async def create_incident(
    body: IncidentCreate,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    if user.role != "user":
        raise HTTPException(status_code=403, detail="Only survivor accounts can log incidents.")
    if body.incident_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"incident_type must be one of: {', '.join(sorted(ALLOWED_TYPES))}",
        )
    if body.priority not in ALLOWED_PRIORITY:
        raise HTTPException(status_code=400, detail="Invalid priority.")

    iid = str(uuid.uuid4())
    now = time.time()
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO incidents (
            id, user_id, incident_type, description, priority, anonymous_to_ngo, created_at,
            status, resolved_at, assigned_to, assigned_unit, progress_state, progress_updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, 'received', ?)
        """,
        (
            iid,
            user.id,
            body.incident_type,
            body.description.strip(),
            body.priority,
            1 if body.anonymous_to_ngo else 0,
            now,
            now,
        ),
    )
    conn.commit()
    conn.close()

    return IncidentOut(
        id=iid,
        incident_type=body.incident_type,
        description=body.description.strip(),
        priority=body.priority,
        anonymous_to_ngo=body.anonymous_to_ngo,
        created_at=now,
        status="pending",
        resolved_at=None,
        assigned_to=None,
        assigned_unit=None,
        progress_state="received",
        progress_updated_at=now,
        reporter_display_name=None,
        reporter_kind=None,
    )


class IncidentWorkflowBody(BaseModel):
    assigned_to: str | None = Field(None, max_length=200)
    assigned_unit: str | None = Field(None, max_length=200)
    progress_state: str | None = None


@router.patch("/{incident_id}/workflow", response_model=IncidentOut)
async def update_incident_workflow(
    incident_id: str,
    body: IncidentWorkflowBody,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    if user.role != "ngo":
        raise HTTPException(status_code=403, detail="Only NGO staff can update assignments and progress.")

    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT i.id, i.user_id, i.incident_type, i.description, i.priority, i.anonymous_to_ngo, i.created_at,
               i.status, i.resolved_at, i.assigned_to, i.assigned_unit, i.progress_state, i.progress_updated_at,
               u.name AS user_name
        FROM incidents i
        JOIN users u ON u.id = i.user_id
        WHERE i.id = ?
        """,
        (incident_id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found.")

    patch = body.model_dump(exclude_unset=True)
    at = _row_assigned_to(row)
    au = _row_assigned_unit(row)
    ps = _row_progress_state(row)
    if "assigned_to" in patch:
        v = patch["assigned_to"]
        at = v.strip() if isinstance(v, str) and v.strip() else None
    if "assigned_unit" in patch:
        v = patch["assigned_unit"]
        au = v.strip() if isinstance(v, str) and v.strip() else None
    if "progress_state" in patch:
        ps = patch["progress_state"]
        if ps not in ALLOWED_PROGRESS:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"progress_state must be one of: {', '.join(sorted(ALLOWED_PROGRESS))}",
            )

    now = time.time()
    pu = _row_progress_updated_at(row)
    if patch:
        pu = now

    cur.execute(
        """
        UPDATE incidents SET assigned_to = ?, assigned_unit = ?, progress_state = ?, progress_updated_at = ?
        WHERE id = ?
        """,
        (at, au, ps, pu, incident_id),
    )
    conn.commit()
    cur.execute(
        """
        SELECT i.id, i.user_id, i.incident_type, i.description, i.priority, i.anonymous_to_ngo, i.created_at,
               i.status, i.resolved_at, i.assigned_to, i.assigned_unit, i.progress_state, i.progress_updated_at,
               u.name AS user_name
        FROM incidents i
        JOIN users u ON u.id = i.user_id
        WHERE i.id = ?
        """,
        (incident_id,),
    )
    updated = cur.fetchone()
    conn.close()
    assert updated is not None
    return _row_incident_out(updated, user_name=updated["user_name"], for_ngo=True)


class IncidentStatusBody(BaseModel):
    status: Literal["pending", "resolved"]


@router.patch("/{incident_id}/status", response_model=IncidentOut)
async def update_incident_status(
    incident_id: str,
    body: IncidentStatusBody,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    if body.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status.")

    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT i.id, i.user_id, i.incident_type, i.description, i.priority, i.anonymous_to_ngo, i.created_at,
               i.status, i.resolved_at, i.assigned_to, i.assigned_unit, i.progress_state, i.progress_updated_at,
               u.name AS user_name
        FROM incidents i
        JOIN users u ON u.id = i.user_id
        WHERE i.id = ?
        """,
        (incident_id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found.")

    if user.role != "ngo" and row["user_id"] != user.id:
        conn.close()
        raise HTTPException(status_code=403, detail="Not allowed to update this incident.")

    now = time.time()
    resolved_at: float | None = now if body.status == "resolved" else None
    prog = _row_progress_state(row)
    if body.status == "resolved":
        prog = "closed"
    elif body.status == "pending" and prog == "closed":
        prog = "in_progress"

    cur.execute(
        """
        UPDATE incidents SET status = ?, resolved_at = ?, progress_state = ?, progress_updated_at = ?
        WHERE id = ?
        """,
        (body.status, resolved_at, prog, now, incident_id),
    )
    conn.commit()
    cur.execute(
        """
        SELECT i.id, i.user_id, i.incident_type, i.description, i.priority, i.anonymous_to_ngo, i.created_at,
               i.status, i.resolved_at, i.assigned_to, i.assigned_unit, i.progress_state, i.progress_updated_at,
               u.name AS user_name
        FROM incidents i
        JOIN users u ON u.id = i.user_id
        WHERE i.id = ?
        """,
        (incident_id,),
    )
    updated = cur.fetchone()
    conn.close()
    assert updated is not None
    return _row_incident_out(updated, user_name=updated["user_name"], for_ngo=user.role == "ngo")


@router.get("", response_model=list[IncidentOut])
async def list_incidents(
    user: Annotated[UserPublic, Depends(get_current_user)],
    filter_kind: Literal["all", "anonymous", "registered"] = "all",
    case_status: Literal["all", "pending", "resolved"] = "all",
):
    conn = _conn()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    if user.role == "ngo":
        cur.execute(
            """
            SELECT i.id, i.user_id, i.incident_type, i.description, i.priority, i.anonymous_to_ngo, i.created_at,
                   i.status, i.resolved_at, i.assigned_to, i.assigned_unit, i.progress_state, i.progress_updated_at,
                   u.name AS user_name
            FROM incidents i
            JOIN users u ON u.id = i.user_id
            ORDER BY i.created_at DESC
            """
        )
        rows = cur.fetchall()
        conn.close()
        out: list[IncidentOut] = []
        for row in rows:
            rec = _row_incident_out(
                row,
                user_name=row["user_name"],
                for_ngo=True,
            )
            if case_status != "all" and rec.status != case_status:
                continue
            if filter_kind == "all":
                out.append(rec)
            elif filter_kind == "anonymous" and rec.reporter_kind == "anonymous":
                out.append(rec)
            elif filter_kind == "registered" and rec.reporter_kind == "registered":
                out.append(rec)
        return out

    # role user: own incidents only
    cur.execute(
        """
        SELECT id, user_id, incident_type, description, priority, anonymous_to_ngo, created_at, status, resolved_at,
               assigned_to, assigned_unit, progress_state, progress_updated_at
        FROM incidents
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (user.id,),
    )
    rows = cur.fetchall()
    conn.close()
    out_user = [_row_incident_out(r, user_name=None, for_ngo=False) for r in rows]
    if case_status == "all":
        return out_user
    return [r for r in out_user if r.status == case_status]


class IncidentStatsOut(BaseModel):
    pending_cases: int
    resolved_cases: int
    pending_anonymous: int
    pending_registered: int
    incidents_this_week: int


@router.get("/stats", response_model=IncidentStatsOut)
async def incident_stats(user: Annotated[UserPublic, Depends(get_current_user)]):
    if user.role != "ngo":
        raise HTTPException(status_code=403, detail="NGO access only.")
    conn = _conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM incidents WHERE status = 'pending'")
    pending_cases = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM incidents WHERE status = 'resolved'")
    resolved_cases = cur.fetchone()[0]
    cur.execute(
        "SELECT COUNT(*) FROM incidents WHERE status = 'pending' AND anonymous_to_ngo = 1"
    )
    pending_anonymous = cur.fetchone()[0]
    cur.execute(
        "SELECT COUNT(*) FROM incidents WHERE status = 'pending' AND anonymous_to_ngo = 0"
    )
    pending_registered = cur.fetchone()[0]
    week_ago = time.time() - 7 * 86400
    cur.execute("SELECT COUNT(*) FROM incidents WHERE created_at >= ?", (week_ago,))
    incidents_this_week = cur.fetchone()[0]
    conn.close()
    return IncidentStatsOut(
        pending_cases=pending_cases,
        resolved_cases=resolved_cases,
        pending_anonymous=pending_anonymous,
        pending_registered=pending_registered,
        incidents_this_week=incidents_this_week,
    )
