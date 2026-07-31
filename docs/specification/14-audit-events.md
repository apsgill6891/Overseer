# 14. Audit-event specification

## Event envelope

Every event contains:

- `event_id`, schema version, event type, UTC timestamp and simulation timestamp;
- order, batch, orchestration/goal/task run and correlation/causation IDs;
- agent id, level, version, execution type, goal and goal-profile version;
- policy/tool versions;
- actor type/id and role;
- input/output/evidence references plus content hashes;
- decision, reason code, structured rationale;
- previous/new state and aggregate version;
- confidence/data-quality indicators;
- error, retry, timeout, approval, override, and correction fields as applicable;
- previous ledger hash and event hash.

Sensitive payloads are stored by protected reference; the event contains a redacted summary and integrity hash. Address/payment details are not duplicated into rationale text.

## Event families

`order.*`, `run.*`, `task.*`, `plan.generated/rejected/recommended`, `policy.evaluated`, `approval.*`, `inventory.reserved/released/consumed/conflict`, `shipment.*`, `tracking.*`, `human.override`, `configuration.published`, `security.denied`, and `simulation.*`.

## Append and correction semantics

The service transaction includes the operational write and corresponding audit outbox/event. Events cannot be updated or deleted through the application. Corrections append a new event with `corrects_event_id`; current projections rebuild by replay or verified snapshots. Hash chaining makes tampering evident but is not presented as a substitute for access control/backups.

## Example

```json
{
  "event_type": "plan.recommended",
  "order_id": "ORD-...",
  "run_id": "ORUN-...",
  "agent": {"id": "fulfillment-orchestrator", "level": "orchestration", "version": "1.0.0"},
  "decision": "request_approval",
  "reason_code": "AIR_UPGRADE_OVER_AUTHORITY",
  "evidence_refs": ["PLAN-...:v1", "POLICY-...:v3"],
  "previous_state": "Planning",
  "new_state": "AwaitingApproval",
  "quality": {"on_time_probability": 0.96, "complete": true}
}
```

## Correctness measures

- **Task correctness:** recompute deterministic outputs against an independent oracle; calibrate predictive estimates and track missing/stale inputs.
- **Goal correctness:** required-check coverage, feasible-set correctness, constraint compliance, recommendation defensibility, escalation correctness.
- **Orchestration correctness:** correct goal/transition, changed-condition response, recovery choice, authority compliance, checkpoint/resume correctness, human involvement timing.

Metrics use fixture ground truth in tests and sampled human adjudication in runtime; expected scenario answers never appear in the operational interface.
