"""Shared SQLite DB for Chautara: Peer Connect feed (chautara_api) + sanctuary diya/pebble tables (main)."""
import os
import sqlite3
import time

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(_BACKEND_DIR, "chautara_sanctuary.db")


def _conn() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def _migrate_stories_table(cur: sqlite3.Cursor) -> None:
    """Align legacy stories tables with id, content, author, diyas, timestamp, type."""
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='stories'")
    if not cur.fetchone():
        return
    cur.execute("PRAGMA table_info(stories)")
    cols = {row[1] for row in cur.fetchall()}
    if "diyas" not in cols:
        cur.execute("ALTER TABLE stories ADD COLUMN diyas INTEGER DEFAULT 0")
    if "type" not in cols:
        cur.execute("ALTER TABLE stories ADD COLUMN type TEXT DEFAULT 'legacy'")


def init_chautara_sanctuary_db() -> None:
    conn = _conn()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS stories (
            id TEXT PRIMARY KEY,
            content TEXT,
            author TEXT,
            diyas INTEGER,
            timestamp REAL,
            type TEXT
        )
        """
    )
    _migrate_stories_table(cur)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            story_id TEXT,
            content TEXT,
            author TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sanctuary_pebbles (
            id TEXT PRIMARY KEY,
            content TEXT,
            district TEXT,
            flames INTEGER DEFAULT 0,
            stage_month INTEGER DEFAULT 1
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sanctuary_diyas (
            id TEXT PRIMARY KEY,
            expires_at REAL NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sanctuary_stories (
            id TEXT PRIMARY KEY,
            content TEXT,
            location TEXT,
            stage_month INTEGER,
            time_ago TEXT
        )
        """
    )

    conn.commit()
    conn.close()


def seed_chautara_stories_if_empty() -> None:
    conn = _conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM stories")
    count = cur.fetchone()[0]
    if count > 10:
        conn.close()
        return

    samples = [
        "My husband drinks heavily and becomes aggressive",
        "My court case keeps getting delayed",
        "I feel completely alone",
        "My in-laws pressure me constantly",
        "I cannot sleep due to stress",
        "I feel scared about my future",
        "मलाई धेरै डर लागिरहेको छ",
        "म मानसिक रूपमा थाकेको छु",
        "मलाई कसैले बुझ्दैन",
    ]

    for text in samples * 5:
        cur.execute(
            """
            INSERT INTO stories (id, content, author, diyas, timestamp, type)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (os.urandom(4).hex(), text, "Seed", 0, time.time(), "seed"),
        )

    conn.commit()
    conn.close()
