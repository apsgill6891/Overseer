#!/usr/bin/env python3
"""PROJECT OVERSEER governed internal sandbox service.

Uses only the Python standard library so a controlled pilot can run without a
package installation. Production deployments should put this service behind a
trusted OIDC-aware reverse proxy and replace SQLite with the documented
PostgreSQL adapter.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = Path(__file__).with_name("schema.sql")
DEFAULT_DB = Path(__file__).with_name("data") / "overseer.db"
WRITE_ROLES = {"operator", "admin"}
APPROVE_ROLES = {"approver", "admin"}
ADMIN_ROLES = {"admin"}
ORDER_SEED = [
    ("FS-10421", "Northstar Home", "Toronto, ON", "balanced"),
    ("FS-10422", "Willow & Pine", "Vancouver, BC", "service"),
    ("FS-10423", "Arc Athletics", "Montréal, QC", "cost"),
    ("FS-10424", "Morrow Goods", "Calgary, AB", "balanced"),
    ("FS-10425", "Harbour Health", "Halifax, NS", "service"),
    ("FS-10426", "Field Supply", "Ottawa, ON", "cost"),
    ("FS-10427", "Juniper Kids", "Winnipeg, MB", "balanced"),
    ("FS-10428", "Cedar Studio", "Victoria, BC", "service"),
    ("FS-10429", "Peak Pantry", "Edmonton, AB", "cost"),
    ("FS-10430", "Aster Living", "Québec, QC", "balanced"),
]


class ClosingConnection(sqlite3.Connection):
    """Commit/rollback like sqlite3.Connection and always release the handle."""

    def __exit__(self, exc_type, exc_value, traceback):
        try:
            return super().__exit__(exc_type, exc_value, traceback)
        finally:
            self.close()


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def canonical(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


class Store:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self.lock = threading.RLock()
        with self.connect() as db:
            db.executescript(SCHEMA.read_text(encoding="utf-8"))
            timestamp = now()
            db.executemany(
                """INSERT OR IGNORE INTO orders
                   (id, merchant, destination, profile, updated_at)
                   VALUES (?, ?, ?, ?, ?)""",
                [(*row, timestamp) for row in ORDER_SEED],
            )

    def connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=10, factory=ClosingConnection)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
        return db

    def audit(self, db: sqlite3.Connection, actor: dict, action: str,
              object_type: str, object_id: str, details: dict) -> None:
        prior = db.execute(
            "SELECT event_hash FROM audit_events ORDER BY sequence DESC LIMIT 1"
        ).fetchone()
        previous_hash = prior["event_hash"] if prior else "GENESIS"
        event = {
            "event_id": str(uuid.uuid4()),
            "timestamp": now(),
            "actor": actor["id"],
            "actor_role": actor["role"],
            "action": action,
            "object_type": object_type,
            "object_id": object_id,
            "details": details,
            "previous_hash": previous_hash,
        }
        event_hash = hashlib.sha256(canonical(event).encode()).hexdigest()
        db.execute(
            """INSERT INTO audit_events
               (event_id,timestamp,actor,actor_role,action,object_type,object_id,
                details_json,previous_hash,event_hash)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                event["event_id"], event["timestamp"], actor["id"], actor["role"],
                action, object_type, object_id, canonical(details),
                previous_hash, event_hash,
            ),
        )

    def list_orders(self) -> list[dict]:
        with self.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM orders ORDER BY id")]

    def list_audit(self, limit: int = 100) -> list[dict]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT * FROM audit_events ORDER BY sequence DESC LIMIT ?", (limit,)
            )
            return [{**dict(row), "details": json.loads(row["details_json"])} for row in rows]

    def controls(self) -> dict:
        with self.connect() as db:
            rows = db.execute("SELECT key,value,updated_by,updated_at FROM system_controls")
            return {row["key"]: dict(row) for row in rows}

    def set_bounded_execution(self, actor: dict, enabled: bool, note: str) -> dict:
        if len(note.strip()) < 10:
            raise ValueError("a control-change note of at least 10 characters is required")
        value = "enabled" if enabled else "disabled"
        changed = now()
        with self.lock, self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                """INSERT INTO system_controls (key,value,updated_by,updated_at)
                   VALUES ('bounded_execution',?,?,?)
                   ON CONFLICT(key) DO UPDATE SET value=excluded.value,
                   updated_by=excluded.updated_by,updated_at=excluded.updated_at""",
                (value, actor["id"], changed),
            )
            self.audit(db, actor, "control.changed", "system_control",
                       "bounded_execution", {"value": value, "note": note.strip()})
            db.commit()
        return {"bounded_execution": value, "updated_by": actor["id"], "updated_at": changed}

    def verify_audit(self) -> dict:
        with self.connect() as db:
            rows = db.execute("SELECT * FROM audit_events ORDER BY sequence").fetchall()
        expected_previous = "GENESIS"
        for row in rows:
            event = {
                "event_id": row["event_id"], "timestamp": row["timestamp"],
                "actor": row["actor"], "actor_role": row["actor_role"],
                "action": row["action"], "object_type": row["object_type"],
                "object_id": row["object_id"],
                "details": json.loads(row["details_json"]),
                "previous_hash": row["previous_hash"],
            }
            expected_hash = hashlib.sha256(canonical(event).encode()).hexdigest()
            if row["previous_hash"] != expected_previous or not hmac.compare_digest(
                row["event_hash"], expected_hash
            ):
                return {"valid": False, "events": len(rows), "failed_at": row["sequence"]}
            expected_previous = row["event_hash"]
        return {"valid": True, "events": len(rows), "head": expected_previous}

    def create_run(self, actor: dict, payload: dict, key: str) -> tuple[dict, bool]:
        order_ids = payload.get("order_ids")
        if not isinstance(order_ids, list) or not order_ids or len(order_ids) > 100:
            raise ValueError("order_ids must contain 1–100 order IDs")
        mode = payload.get("mode", "shadow")
        if mode not in {"shadow", "recommend", "bounded"}:
            raise ValueError("mode must be shadow, recommend, or bounded")
        if mode == "bounded":
            control = self.controls().get("bounded_execution", {})
            if control.get("value") != "enabled":
                raise Conflict("bounded execution is disabled by the server kill switch")
        confidence = int(payload.get("confidence_limit", 90))
        cost = int(payload.get("cost_limit", 35))
        if not 50 <= confidence <= 100 or not 0 <= cost <= 500:
            raise ValueError("limits are outside the permitted range")
        normalized = {
            "order_ids": sorted(set(str(item) for item in order_ids)),
            "mode": mode,
            "goal_profile": str(payload.get("goal_profile", "balanced")),
            "confidence_limit": confidence,
            "cost_limit": cost,
        }
        request_hash = hashlib.sha256(canonical(normalized).encode()).hexdigest()
        with self.lock, self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            existing = db.execute(
                "SELECT * FROM idempotency_keys WHERE key = ?", (key,)
            ).fetchone()
            if existing:
                if existing["actor"] != actor["id"] or not hmac.compare_digest(
                    existing["request_hash"], request_hash
                ):
                    raise Conflict("idempotency key was already used for another request")
                return json.loads(existing["response_json"]), True
            placeholders = ",".join("?" for _ in normalized["order_ids"])
            found = db.execute(
                f"SELECT id,status FROM orders WHERE id IN ({placeholders})",
                normalized["order_ids"],
            ).fetchall()
            if len(found) != len(normalized["order_ids"]):
                raise ValueError("one or more order IDs do not exist")
            run_id = f"RUN-{uuid.uuid4().hex[:10].upper()}"
            created = now()
            db.execute(
                """INSERT INTO execution_runs
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                (
                    run_id, actor["id"], mode, normalized["goal_profile"], confidence,
                    cost, "Awaiting execution", canonical(normalized), created,
                ),
            )
            outcomes = []
            for order_id in normalized["order_ids"]:
                outcome = {
                    "shadow": "Shadow recommendation",
                    "recommend": "Awaiting approval",
                    "bounded": "Ready to fulfill",
                }[mode]
                db.execute("INSERT INTO run_orders VALUES (?,?,?)", (run_id, order_id, outcome))
                if mode == "shadow":
                    db.execute(
                        """INSERT INTO shadow_evaluations
                           (id,run_id,order_id,recommendation,created_at)
                           VALUES (?,?,?,?,?)""",
                        (f"SHD-{uuid.uuid4().hex[:10].upper()}", run_id, order_id,
                         "Ready to fulfill", created),
                    )
                elif outcome == "Awaiting approval":
                    approval_id = f"APR-{uuid.uuid4().hex[:10].upper()}"
                    db.execute(
                        """INSERT INTO approvals
                           (id,run_id,order_id,reason) VALUES (?,?,?,?)""",
                        (approval_id, run_id, order_id,
                         "Recommend-only mode requires a human decision."),
                    )
                else:
                    db.execute(
                        """UPDATE orders SET status='Ready to fulfill',
                           version=version+1, updated_at=? WHERE id=?""",
                        (created, order_id),
                    )
                outcomes.append({"order_id": order_id, "outcome": outcome})
            response = {"run_id": run_id, "status": {
                "shadow": "Shadow complete", "recommend": "Awaiting approval",
                "bounded": "Ready to fulfill",
            }[mode], "orders": outcomes, "created_at": created}
            self.audit(db, actor, "execution.requested", "run", run_id, normalized)
            db.execute(
                "INSERT INTO idempotency_keys VALUES (?,?,?,?,?)",
                (key, actor["id"], request_hash, canonical(response), created),
            )
            db.commit()
            return response, False

    def decide(self, actor: dict, approval_id: str, payload: dict) -> dict:
        decision = payload.get("decision")
        if decision not in {"approve", "reject"}:
            raise ValueError("decision must be approve or reject")
        note = str(payload.get("note", "")).strip()
        if len(note) < 3:
            raise ValueError("a decision note of at least 3 characters is required")
        with self.lock, self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            approval = db.execute(
                "SELECT * FROM approvals WHERE id=?", (approval_id,)
            ).fetchone()
            if not approval:
                raise NotFound("approval was not found")
            if approval["status"] != "Pending":
                raise Conflict("approval was already decided")
            decided_at = now()
            status = "Approved" if decision == "approve" else "Rejected"
            order_status = "Ready to fulfill" if decision == "approve" else "Held"
            db.execute(
                """UPDATE approvals SET status=?,decided_by=?,decided_at=?,
                   decision_note=? WHERE id=?""",
                (status, actor["id"], decided_at, note, approval_id),
            )
            db.execute(
                """UPDATE orders SET status=?,version=version+1,updated_at=?
                   WHERE id=?""",
                (order_status, decided_at, approval["order_id"]),
            )
            self.audit(db, actor, f"approval.{decision}", "approval", approval_id, {
                "order_id": approval["order_id"], "run_id": approval["run_id"],
                "note": note,
            })
            db.commit()
            return {"approval_id": approval_id, "status": status,
                    "order_status": order_status, "decided_at": decided_at}


class Conflict(Exception):
    pass


class NotFound(Exception):
    pass


class Handler(SimpleHTTPRequestHandler):
    server_version = "Overseer/0.1"

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline'; "
            "script-src 'self'; img-src 'self' data:; connect-src 'self'",
        )
        super().end_headers()

    def translate_path(self, path: str) -> str:
        relative = urlparse(path).path.lstrip("/") or "index.html"
        candidate = (ROOT / relative).resolve()
        return str(candidate if candidate == ROOT or ROOT in candidate.parents else ROOT / "index.html")

    def actor(self) -> dict:
        dev = os.environ.get("OVERSEER_DEV_MODE", "0") == "1"
        if dev:
            return {
                "id": self.headers.get("X-Overseer-User", "local.operator"),
                "role": self.headers.get("X-Overseer-Role", "admin").lower(),
                "mode": "development",
            }
        expected = os.environ.get("OVERSEER_PROXY_SECRET", "")
        provided = self.headers.get("X-Overseer-Proxy-Secret", "")
        if not expected or not hmac.compare_digest(provided, expected):
            raise PermissionError("trusted identity proxy authentication is required")
        actor_id = self.headers.get("X-Overseer-User", "").strip()
        role = self.headers.get("X-Overseer-Role", "").lower()
        if not actor_id or role not in WRITE_ROLES | APPROVE_ROLES | {"viewer", "auditor"}:
            raise PermissionError("identity proxy supplied an invalid user or role")
        return {"id": actor_id, "role": role, "mode": "proxy"}

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("request body is too large")
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError as exc:
            raise ValueError("request body must be valid JSON") from exc

    def json(self, status: int, body: object, extra: dict | None = None) -> None:
        encoded = canonical(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Correlation-ID", self.correlation_id)
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(encoded)

    def route(self, method: str) -> None:
        supplied_correlation = self.headers.get("X-Correlation-ID", "").strip()
        self.correlation_id = supplied_correlation[:80] or str(uuid.uuid4())
        parsed = urlparse(self.path)
        path = parsed.path
        if not path.startswith("/api/"):
            return super().do_GET() if method == "GET" else self.json(HTTPStatus.NOT_FOUND, {"error": "not found"})
        try:
            actor = self.actor()
            store: Store = self.server.store
            if method == "GET" and path == "/api/health":
                return self.json(HTTPStatus.OK, {
                    "status": "ok", "service": "project-overseer",
                    "audit": store.verify_audit(), "time": now(),
                })
            if method == "GET" and path == "/api/readiness":
                audit = store.verify_audit()
                controls = store.controls()
                return self.json(HTTPStatus.OK if audit["valid"] else HTTPStatus.SERVICE_UNAVAILABLE, {
                    "ready": audit["valid"],
                    "checks": {
                        "database": "ready",
                        "audit_chain": "ready" if audit["valid"] else "failed",
                        "identity": actor["mode"],
                        "bounded_execution": controls["bounded_execution"]["value"],
                    },
                })
            if method == "GET" and path == "/api/session":
                return self.json(HTTPStatus.OK, {"actor": actor, "capabilities": {
                    "execute": actor["role"] in WRITE_ROLES,
                    "approve": actor["role"] in APPROVE_ROLES,
                    "admin": actor["role"] in ADMIN_ROLES,
                }})
            if method == "GET" and path == "/api/orders":
                return self.json(HTTPStatus.OK, {"orders": store.list_orders()})
            if method == "GET" and path == "/api/audit":
                return self.json(HTTPStatus.OK, {
                    "events": store.list_audit(), "verification": store.verify_audit(),
                })
            if method == "GET" and path == "/api/controls":
                return self.json(HTTPStatus.OK, {"controls": store.controls()})
            if method == "POST" and path == "/api/controls/bounded-execution":
                if actor["role"] not in ADMIN_ROLES:
                    return self.json(HTTPStatus.FORBIDDEN, {"error": "admin role required"})
                payload = self.read_json()
                if not isinstance(payload.get("enabled"), bool):
                    raise ValueError("enabled must be true or false")
                return self.json(HTTPStatus.OK, store.set_bounded_execution(
                    actor, payload["enabled"], str(payload.get("note", ""))
                ))
            if method == "POST" and path == "/api/runs":
                if actor["role"] not in WRITE_ROLES:
                    return self.json(HTTPStatus.FORBIDDEN, {"error": "operator role required"})
                key = self.headers.get("Idempotency-Key", "").strip()
                if len(key) < 12:
                    raise ValueError("Idempotency-Key header must be at least 12 characters")
                result, replay = store.create_run(actor, self.read_json(), key)
                return self.json(
                    HTTPStatus.OK if replay else HTTPStatus.CREATED, result,
                    {"Idempotency-Replayed": str(replay).lower()},
                )
            prefix = "/api/approvals/"
            if method == "POST" and path.startswith(prefix) and path.endswith("/decision"):
                if actor["role"] not in APPROVE_ROLES:
                    return self.json(HTTPStatus.FORBIDDEN, {"error": "approver role required"})
                approval_id = path[len(prefix):-len("/decision")].strip("/")
                return self.json(HTTPStatus.OK, store.decide(actor, approval_id, self.read_json()))
            return self.json(HTTPStatus.NOT_FOUND, {"error": "route not found"})
        except PermissionError as exc:
            self.json(HTTPStatus.UNAUTHORIZED, {"error": str(exc)})
        except NotFound as exc:
            self.json(HTTPStatus.NOT_FOUND, {"error": str(exc)})
        except Conflict as exc:
            self.json(HTTPStatus.CONFLICT, {"error": str(exc)})
        except (ValueError, TypeError) as exc:
            self.json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
        except Exception:
            self.json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "internal service error"})

    def do_GET(self) -> None:
        self.route("GET")

    def do_POST(self) -> None:
        self.route("POST")

    def log_message(self, fmt: str, *args: object) -> None:
        print(canonical({"timestamp": now(), "client": self.client_address[0],
                         "message": fmt % args}))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run PROJECT OVERSEER internal sandbox")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8080, type=int)
    parser.add_argument("--database", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.store = Store(args.database)
    print(f"PROJECT OVERSEER listening on http://{args.host}:{args.port}")
    print("Set OVERSEER_DEV_MODE=1 for local development authentication.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
