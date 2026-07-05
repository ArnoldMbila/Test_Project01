"""SQLite-Speicher fuer Aufgaben, Termine und Chat-Verlauf."""

import sqlite3
import threading
from datetime import datetime


class Storage:
    def __init__(self, path: str):
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._create_tables()

    def _create_tables(self) -> None:
        with self._lock:
            self._conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    due TEXT,
                    priority TEXT DEFAULT 'normal',
                    done INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    starts_at TEXT NOT NULL,
                    location TEXT,
                    reminder_minutes INTEGER DEFAULT 30,
                    reminded INTEGER DEFAULT 0,
                    cancelled INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
            self._conn.commit()

    # ------------------------------------------------------------ Aufgaben

    def add_task(self, chat_id: int, description: str, due: str | None,
                 priority: str) -> int:
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO tasks (chat_id, description, due, priority, created_at)"
                " VALUES (?, ?, ?, ?, ?)",
                (chat_id, description, due, priority, _now()),
            )
            self._conn.commit()
            return cur.lastrowid

    def list_tasks(self, chat_id: int, include_done: bool = False) -> list[dict]:
        query = "SELECT * FROM tasks WHERE chat_id = ?"
        if not include_done:
            query += " AND done = 0"
        query += " ORDER BY done, due IS NULL, due, id"
        with self._lock:
            rows = self._conn.execute(query, (chat_id,)).fetchall()
        return [dict(r) for r in rows]

    def complete_task(self, chat_id: int, task_id: int) -> bool:
        with self._lock:
            cur = self._conn.execute(
                "UPDATE tasks SET done = 1 WHERE id = ? AND chat_id = ?",
                (task_id, chat_id),
            )
            self._conn.commit()
            return cur.rowcount > 0

    def delete_task(self, chat_id: int, task_id: int) -> bool:
        with self._lock:
            cur = self._conn.execute(
                "DELETE FROM tasks WHERE id = ? AND chat_id = ?",
                (task_id, chat_id),
            )
            self._conn.commit()
            return cur.rowcount > 0

    # ------------------------------------------------------------- Termine

    def add_appointment(self, chat_id: int, title: str, starts_at: str,
                        location: str | None, reminder_minutes: int) -> int:
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO appointments"
                " (chat_id, title, starts_at, location, reminder_minutes, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                (chat_id, title, starts_at, location, reminder_minutes, _now()),
            )
            self._conn.commit()
            return cur.lastrowid

    def list_appointments(self, chat_id: int,
                          include_past: bool = False) -> list[dict]:
        query = "SELECT * FROM appointments WHERE chat_id = ? AND cancelled = 0"
        params: list = [chat_id]
        if not include_past:
            query += " AND starts_at >= ?"
            params.append(_now())
        query += " ORDER BY starts_at"
        with self._lock:
            rows = self._conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    def cancel_appointment(self, chat_id: int, appointment_id: int) -> bool:
        with self._lock:
            cur = self._conn.execute(
                "UPDATE appointments SET cancelled = 1"
                " WHERE id = ? AND chat_id = ?",
                (appointment_id, chat_id),
            )
            self._conn.commit()
            return cur.rowcount > 0

    def due_reminders(self, now_iso: str) -> list[dict]:
        """Alle Termine, deren Erinnerungszeitpunkt erreicht ist."""
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT * FROM appointments
                WHERE cancelled = 0 AND reminded = 0 AND starts_at >= ?
                  AND datetime(starts_at, '-' || reminder_minutes || ' minutes')
                      <= datetime(?)
                """,
                (now_iso, now_iso),
            ).fetchall()
        return [dict(r) for r in rows]

    def mark_reminded(self, appointment_id: int) -> None:
        with self._lock:
            self._conn.execute(
                "UPDATE appointments SET reminded = 1 WHERE id = ?",
                (appointment_id,),
            )
            self._conn.commit()

    # -------------------------------------------------------- Chat-Verlauf

    def append_history(self, chat_id: int, role: str, content: str) -> None:
        with self._lock:
            self._conn.execute(
                "INSERT INTO history (chat_id, role, content, created_at)"
                " VALUES (?, ?, ?, ?)",
                (chat_id, role, content, _now()),
            )
            self._conn.commit()

    def get_history(self, chat_id: int, limit: int = 20) -> list[dict]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT role, content FROM history WHERE chat_id = ?"
                " ORDER BY id DESC LIMIT ?",
                (chat_id, limit),
            ).fetchall()
        return [{"role": r["role"], "content": r["content"]}
                for r in reversed(rows)]

    def clear_history(self, chat_id: int) -> None:
        with self._lock:
            self._conn.execute("DELETE FROM history WHERE chat_id = ?", (chat_id,))
            self._conn.commit()


def _now() -> str:
    return datetime.now().replace(microsecond=0).isoformat(sep=" ")
