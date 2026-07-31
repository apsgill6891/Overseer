"""PostgreSQL runtime adapter for PROJECT OVERSEER."""

from pathlib import Path
import re
import threading

import psycopg
from psycopg.rows import dict_row

from overseer_server import ORDER_SEED, Store, now

SCHEMA = Path(__file__).with_name("postgres") / "schema.sql"


class PgConnection:
    """Small DB-API compatibility layer for the tested Store contract."""

    def __init__(self, connection):
        self.connection = connection

    def execute(self, query, params=None):
        statement = query
        if statement.strip().upper() == "BEGIN IMMEDIATE":
            statement = "BEGIN"
        statement = statement.replace("?", "%s")
        return self.connection.execute(statement, params or ())

    def executemany(self, query, params):
        return self.connection.cursor().executemany(query.replace("?", "%s"), params)

    def commit(self):
        self.connection.commit()

    def __enter__(self):
        self.connection.__enter__()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return self.connection.__exit__(exc_type, exc_value, traceback)


class PostgresStore(Store):
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.lock = threading.RLock()
        with self.connect() as db:
            db.execute(SCHEMA.read_text(encoding="utf-8"))
            timestamp = now()
            db.executemany(
                """INSERT INTO orders
                   (id,merchant,destination,profile,updated_at)
                   VALUES (?,?,?,?,?)
                   ON CONFLICT (id) DO NOTHING""",
                [(*row, timestamp) for row in ORDER_SEED],
            )

    def connect(self):
        return PgConnection(
            psycopg.connect(self.database_url, row_factory=dict_row, autocommit=False)
        )
