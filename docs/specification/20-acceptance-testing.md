# 20. Acceptance criteria and testing strategy

## Acceptance criteria

- `AC-001` A ten-order batch is generated, selected independently, and creates one orchestration run per selected order (`PR-001/002`).
- `AC-002` Each controlled scenario follows an acceptable goal path and never performs its prohibited actions (`SC-001..010`).
- `AC-003` Every recommendation exposes feasible alternatives, rejected reasons, promise result, cost breakdown, preference vector, evidence, and authority (`PR-005/018`).
- `AC-004` No hard-constraint violation can be released, even by AI proposal or human override (`BR-005..007/018..020`).
- `AC-005` Concurrent last-unit orders produce at most one reservation; loser replans without negative inventory (`BR-001/002/008`).
- `AC-006` Release and departure update all specified state atomically; injected audit failure rolls back mutation (`PR-010/011`, `BR-009/017`).
- `AC-007` Expired/stale approvals cannot execute; modifications create a new recommendation as required (`BR-012/013`).
- `AC-008` Disruption after tender starts recovery, preserves original decisions, and routes approval correctly (`SC-010`).
- `AC-009` Every transition/action is reconstructible from append-only events; corrections do not rewrite history (`PR-014`).
- `AC-010` Role matrix is enforced server-side; denied privileged attempts are audited (`PR-016`).
- `AC-011` Reset reproduces normalized baseline checksum and canonical outcomes (`PR-015`).
- `AC-012` External AI outage still permits the complete deterministic canonical simulation (`ART-005`, AI boundary).
- `AC-013` Keyboard, screen-reader, contrast, reduced-motion, loading/empty/error/success checks pass for all nine pages.

## Test layers

- Unit/property: money, available inventory, plan ordering, timezones/cutoffs, package fit, service coverage, transitions.
- Contract: every tool and simulator against versioned schemas; malformed/oversized outputs.
- State-machine/model tests: all legal transitions reachable; illegal jumps rejected.
- Integration/transaction: reservations, release, departure, approvals, audit outbox, idempotent retry.
- Scenario: ten canonical fixtures plus boundary variants and mutation tests.
- Concurrency/chaos: last unit, dependency timeout, crash after command submit, audit outage, duplicate event.
- Security: RBAC, scope, stale approval, injection/redaction, export, direct API attempts.
- Accessibility/responsive: automated checks plus keyboard and screen-reader manual pass.
- AI evaluation (when enabled): goal-selection accuracy, unsupported-fact rate, validator rejection rate, deterministic fallback.

## Traceability crosswalk

| Article | Requirements / rules | Agents/data | Scenarios/screens | Tests |
|---|---|---|---|---|
| `ART-001` atomic tasks | `PR-004/017`, `BR-015` | `AG-T01..T10`, TaskRun | all; `UI-003/005` | unit/contract, `AC-002` |
| `ART-002` goal workflows | `PR-005/007` | three GoalRuns | `SC-001..010`, `UI-006` | scenario, goal correctness |
| `ART-003` orchestration | `PR-002/012/013` | OrchestrationRun | `SC-005/010`, `UI-001/003` | model/chaos, `AC-008` |
| `ART-004` end-to-end execution | `PR-010/011` | reservation/shipment/audit | `UI-002..009` | transaction, `AC-006` |
| `ART-005` trust/governance | `PR-008/009/014/016`, `BR-009..013` | policy/approval/audit | `SC-008/009`, `UI-007..009` | security/audit, `AC-004/007/009/010` |
| `ART-006` human oversight | `PR-009/013` | users/roles/decisions | `UI-001/008` | usability/RBAC |
| `ART-007` ATP/CTP/cost | `PR-005/006/018`, `BR-001/006/007` | plans/inventory/services | `SC-001..008`, `UI-004` | oracle/property, `AC-003/005` |

Release requires all `AC-*`, zero open critical invariant/security defects, and owner approval of the resolved specification.
