CREATE TABLE IF NOT EXISTS schema_version (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  merchant text NOT NULL,
  destination text NOT NULL,
  profile text NOT NULL,
  status text NOT NULL DEFAULT 'Received',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS execution_runs (
  id text PRIMARY KEY,
  requested_by text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('shadow','recommend','bounded')),
  goal_profile text NOT NULL,
  confidence_limit integer NOT NULL CHECK (confidence_limit BETWEEN 50 AND 100),
  cost_limit integer NOT NULL CHECK (cost_limit BETWEEN 0 AND 500),
  status text NOT NULL,
  request_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS run_orders (
  run_id text NOT NULL REFERENCES execution_runs(id),
  order_id text NOT NULL REFERENCES orders(id),
  outcome text NOT NULL,
  PRIMARY KEY (run_id, order_id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES execution_runs(id),
  order_id text NOT NULL REFERENCES orders(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  decided_by text,
  decided_at timestamptz,
  decision_note text
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  actor text NOT NULL,
  request_hash text NOT NULL,
  response_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE,
  timestamp timestamptz NOT NULL,
  actor text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  details_json jsonb NOT NULL,
  previous_hash text NOT NULL,
  event_hash text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shadow_evaluations (
  id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES execution_runs(id),
  order_id text NOT NULL REFERENCES orders(id),
  recommendation text NOT NULL,
  baseline_outcome text,
  matched_baseline boolean,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_controls (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_controls(key,value,updated_by)
VALUES ('bounded_execution','disabled','system')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_audit_object
  ON audit_events(object_type, object_id, sequence);
CREATE INDEX IF NOT EXISTS idx_approvals_status
  ON approvals(status, order_id);
CREATE INDEX IF NOT EXISTS idx_shadow_review
  ON shadow_evaluations(matched_baseline, created_at);

INSERT INTO schema_version(version) VALUES (1)
ON CONFLICT (version) DO NOTHING;
