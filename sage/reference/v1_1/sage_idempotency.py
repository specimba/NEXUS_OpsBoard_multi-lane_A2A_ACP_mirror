"""Atomic, payload-aware SQLite idempotency for NEXUS SAGE."""

from __future__ import annotations

from contextlib import closing

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any, Literal

ReserveState = Literal["reserved", "duplicate", "in_progress", "conflict"]


@dataclass(frozen=True)
class Reservation:
    state: ReserveState
    response: dict[str, Any] | None = None
    http_status: int | None = None


def canonical_request_hash(payload: Any) -> str:
    encoded = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


class IdempotencyStore:
    def __init__(self, path: str | Path, ttl_hours: int = 24) -> None:
        self.path = str(path)
        self.ttl_hours = ttl_hours
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA busy_timeout=10000")
        connection.execute("PRAGMA foreign_keys=ON")
        return connection

    def _initialize(self) -> None:
        with closing(self._connect()) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sage_idempotency (
                    principal TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    idempotency_key TEXT NOT NULL,
                    request_hash TEXT NOT NULL,
                    state TEXT NOT NULL CHECK(state IN ('in_progress','completed','failed')),
                    response_json TEXT,
                    http_status INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    PRIMARY KEY (principal, operation, idempotency_key)
                )
                """
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_sage_idem_expiry "
                "ON sage_idempotency(expires_at)"
            )

    def reserve(
        self,
        *,
        principal: str,
        operation: str,
        idempotency_key: str,
        payload: Any,
    ) -> Reservation:
        request_hash = canonical_request_hash(payload)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=self.ttl_hours)

        with closing(self._connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT request_hash, state, response_json, http_status, expires_at
                FROM sage_idempotency
                WHERE principal=? AND operation=? AND idempotency_key=?
                """,
                (principal, operation, idempotency_key),
            ).fetchone()

            if row is not None:
                if datetime.fromisoformat(row["expires_at"]) <= now:
                    connection.execute(
                        """
                        DELETE FROM sage_idempotency
                        WHERE principal=? AND operation=? AND idempotency_key=?
                        """,
                        (principal, operation, idempotency_key),
                    )
                elif row["request_hash"] != request_hash:
                    connection.execute("COMMIT")
                    return Reservation("conflict")
                elif row["state"] == "completed":
                    response = (
                        json.loads(row["response_json"])
                        if row["response_json"] is not None
                        else None
                    )
                    connection.execute("COMMIT")
                    return Reservation(
                        "duplicate",
                        response=response,
                        http_status=row["http_status"],
                    )
                else:
                    connection.execute("COMMIT")
                    return Reservation("in_progress")

            timestamp = now.isoformat()
            connection.execute(
                """
                INSERT INTO sage_idempotency (
                    principal, operation, idempotency_key, request_hash, state,
                    created_at, updated_at, expires_at
                ) VALUES (?, ?, ?, ?, 'in_progress', ?, ?, ?)
                """,
                (
                    principal,
                    operation,
                    idempotency_key,
                    request_hash,
                    timestamp,
                    timestamp,
                    expires.isoformat(),
                ),
            )
            connection.execute("COMMIT")
            return Reservation("reserved")

    def complete(
        self,
        *,
        principal: str,
        operation: str,
        idempotency_key: str,
        response: dict[str, Any],
        http_status: int,
    ) -> None:
        encoded = json.dumps(response, separators=(",", ":"), ensure_ascii=False)
        now = datetime.now(timezone.utc).isoformat()
        with closing(self._connect()) as connection:
            cursor = connection.execute(
                """
                UPDATE sage_idempotency
                SET state='completed', response_json=?, http_status=?, updated_at=?
                WHERE principal=? AND operation=? AND idempotency_key=?
                  AND state='in_progress'
                """,
                (
                    encoded,
                    http_status,
                    now,
                    principal,
                    operation,
                    idempotency_key,
                ),
            )
            if cursor.rowcount != 1:
                raise RuntimeError("Idempotency reservation is missing or not active.")

    def fail(
        self,
        *,
        principal: str,
        operation: str,
        idempotency_key: str,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with closing(self._connect()) as connection:
            connection.execute(
                """
                UPDATE sage_idempotency
                SET state='failed', updated_at=?
                WHERE principal=? AND operation=? AND idempotency_key=?
                """,
                (now, principal, operation, idempotency_key),
            )

    def cleanup_expired(self) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with closing(self._connect()) as connection:
            cursor = connection.execute(
                "DELETE FROM sage_idempotency WHERE expires_at <= ?",
                (now,),
            )
            return cursor.rowcount
