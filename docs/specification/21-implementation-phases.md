# 21. Proposed implementation phases

Implementation remains blocked pending explicit specification approval.

1. **Approval and architecture decisions** — resolve `Q-*`, baseline package, add decision records. Exit: owner approval.
2. **Domain kernel and seed generator** — types, invariants, reference data, independent fixture oracle, reset/checksum. Exit: deterministic unit/property tests.
3. **Operational persistence and state machines** — order, inventory, runs, approvals, shipments, audit ledger, idempotent transactions. Exit: concurrency/replay tests.
4. **Task capabilities and plan engine** — registered deterministic tools, delivery estimator, exhaustive/bounded plan generation, lexicographic selection. Exit: all planning scenarios.
5. **Goal workflows and deterministic orchestrator** — three goals, checkpoints, failure/retry/recovery, authority. Exit: `SC-001..010` headless acceptance.
6. **Control-centre interface** — nine product areas, live run updates, evidence/approval/audit interactions, responsive/accessibility states. Exit: role-based end-to-end tests.
7. **Hardening and evaluation** — chaos, security, performance, accessibility, audit export, demo runbook. Exit: all `AC-*`.
8. **Optional AI adapter experiment** — only after deterministic baseline; typed proposals, redaction, evaluation, fallback. Exit: demonstrated incremental value with no loss of control.

## Phase discipline

Each phase ships documentation updates, versioned contracts, tests, and traceability changes together. Integration adapters target ports established by the domain, allowing simulated storefront/WMS/carrier systems to be replaced later. No phase adds real external mutations without a separate security and operational review.
