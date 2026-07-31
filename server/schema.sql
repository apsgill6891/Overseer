PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  merchant TEXT NOT NULL,
  destination TEXT NOT NULL,
  profile TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS execution_runs (
  id TEXT PRIMARY KEY,
  requested_by TEXT NOT NULL,
  mode TEXT NOT NULL,
  goal_profile TEXT NOT NULL,
  confidence_limit INTEGER NOT NULL,
  cost_limit INTEGER NOT NULL,
  status TEXT NOT NULL,
  request_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS run_orders (
  run_id TEXT NOT NULL REFERENCES execution_runs(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  outcome TEXT NOT NULL,
  PRIMARY KEY (run_id, order_id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES execution_runs(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  decided_by TEXT,
  decided_at TEXT,
  decision_note TEXT
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_audit_object
  ON audit_events(object_type, object_id, sequence);
CREATE INDEX IF NOT EXISTS idx_approvals_status
  ON approvals(status, order_id);
