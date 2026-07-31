# 1. Product requirements

## Vision and outcome

FlowShip operators need to move from knowing that an order has a problem to executing a safe, explainable resolution. PROJECT OVERSEER makes each operational decision, authority boundary, state change, and piece of evidence visible.

Success means an authorized user can receive ten orders, run independent orchestration for selected orders, inspect feasible alternatives and rejected plans, intervene where required, and observe transactional operational changes with a complete audit trail.

## Users and jobs

- Task Agent Operator: diagnose narrow capability errors and supervise retries.
- Goal Agent Supervisor: evaluate workflow completeness, recommendations, and escalations.
- Orchestration Overseer: manage end-to-end execution and cross-agent recovery.
- Policy Administrator: version business policy and authority boundaries.
- Read-only Auditor: reconstruct what happened without changing state.

## Functional requirements

- `PR-001` Generate a controlled ten-order intake batch; selecting a subset must not affect unselected orders.
- `PR-002` Create one independent orchestration run per selected order, grouped by a monitoring-only batch.
- `PR-003` Confirm execution mode and assigned goal profile before execution. V1 modes are **recommend only** and **execute within authority**.
- `PR-004` Display orchestration, goal, and task hierarchy with statuses, evidence, elapsed time, retries, and versions.
- `PR-005` Generate alternatives, eliminate infeasible plans with explicit reasons, and recommend a defensible feasible plan without an opaque composite score.
- `PR-006` Keep accepted delivery promise, inventory integrity, safety, permissions, and product/carrier restrictions as hard constraints.
- `PR-007` Apply versioned goal profiles and route modifiers; Cross-Border is not a separate agent or base profile.
- `PR-008` Automatically release only when all checks pass and the selected plan is within profile, merchant, user, and cost authority.
- `PR-009` Support approve, reject, modify within allowed fields, and hold; capture reason and identity.
- `PR-010` Commit reservations, workload, packaging, carrier assignment, shipment, order state, and audit events atomically.
- `PR-011` On simulated departure, consume reserved on-hand inventory, update workload and shipment/order states, and append audit events atomically.
- `PR-012` Detect a simulated carrier disruption, reassess the promise, start delivery recovery, and replan or escalate.
- `PR-013` Permit pause/resume/retry only at declared safe checkpoints; make commands idempotent.
- `PR-014` Provide evidence-linked, append-only history for all system, policy, agent, and human actions.
- `PR-015` Reset mutable simulation state exactly to the fixed seed snapshot.
- `PR-016` Enforce role-based least privilege on UI actions and service commands.
- `PR-017` Version agent definitions, tools, policies, and goal profiles used by every run.
- `PR-018` Show why a rejected plan failed and why the recommendation won using constraint, cost, confidence, and preference facts.

## Decision procedure

For each order: enumerate candidates → validate hard constraints → apply mandatory policies → test delivery promise → calculate expected cost → apply lexicographic/tie-break preferences → recommend → authorize or request approval. Preferences may break ties or choose among promise-satisfying plans; they cannot compensate for a constraint violation.

## Outcome metrics

- Planning completion rate and median simulated cycle time.
- Automatic-release rate, approval rate, and correct-escalation rate.
- Promise-feasible recommendation rate.
- Prevented double allocations and invalid transitions.
- Task factual accuracy, goal workflow correctness, orchestration correctness.
- Human override and post-release recovery outcomes.

No article performance claim is a V1 target; the simulation establishes baselines rather than asserting real-world savings.

## Out of scope

Real commerce/WMS/carrier APIs; purchasing and replenishment; manufacturing; fleet/aircraft scheduling; demand forecasting; network design; billing; generalized conversational assistant; autonomous policy authoring; full returns; multi-package optimization beyond defined parcel rules; production ML training.
