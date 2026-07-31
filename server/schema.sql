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

CREATE TABLE IF NOT EXISTS shadow_evaluations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES execution_runs(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  recommendation TEXT NOT NULL,
  baseline_outcome TEXT,
  matched_baseline INTEGER,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_controls (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO system_controls (key,value,updated_by,updated_at)
VALUES ('bounded_execution','disabled','system','1970-01-01T00:00:00.000Z');

CREATE INDEX IF NOT EXISTS idx_audit_object
  ON audit_events(object_type, object_id, sequence);
CREATE INDEX IF NOT EXISTS idx_approvals_status
  ON approvals(status, order_id);
CREATE INDEX IF NOT EXISTS idx_shadow_review
  ON shadow_evaluations(matched_baseline, created_at);
