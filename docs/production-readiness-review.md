# PROJECT OVERSEER — production-readiness review

Assessment date: 2026-07-30  
Current classification: **Interactive product simulation; not approved for live fulfillment operations**

## Executive conclusion

The current GitHub Pages application is suitable for demonstrating the product model, controlled agent hierarchy, explainability approach, approval experience, and deterministic decision sequence. A company should **not** connect it to real orders, inventory, payments, warehouses, or carriers.

The current implementation runs entirely in one browser tab. Data is synthetic and held in memory; refreshing resets operational work. It has no trusted server, durable database, real identity provider, transactional inventory reservation, integration credentials, monitoring, disaster recovery, or production security controls.

## Readiness by area

| Area | Current state | Production requirement |
|---|---|---|
| Product workflow | Demonstrated | Validate with real operators and exception volumes |
| Agent transparency | Interactive simulation | Persist every input/output, version, and evidence reference |
| Decision rules | Representative browser logic | Move to tested server-side domain and policy services |
| Inventory integrity | Simulated | ACID transactions, concurrency control, idempotency, reconciliation |
| Persistence | None | Production database, immutable audit storage, backup and restore |
| Authentication | Role label only | SSO/OIDC, MFA policy, session management, scoped RBAC |
| Integrations | Simulated | Contracted Shopify/OMS, WMS, carrier, address, customs interfaces |
| Security | UX concepts only | Threat model, secret management, encryption, audit access, pen test |
| Reliability | Static hosting | Redundant services, queues, retries, SLOs, alerts, runbooks |
| AI governance | Optional conceptual boundary | Model gateway, evaluation, redaction, fallback, change approval |
| Compliance/privacy | Synthetic data | Data classification, retention, PIPEDA/privacy review, vendor review |
| Deployment | GitHub Pages | Staged environments, CI policy, signed releases, rollback |

## Minimum path to a controlled pilot

1. Implement the deterministic domain kernel and state machines on a trusted backend.
2. Add PostgreSQL or equivalent transactional persistence with an append-only audit ledger.
3. Add SSO, server-side RBAC, separation of duties, and privileged-action reauthentication.
4. Build simulator-backed integration ports, then certify one sandbox connector at a time.
5. Add idempotent commands, reservation concurrency tests, reconciliation, and failure recovery.
6. Run the ten controlled scenarios plus load, chaos, security, accessibility, and audit-replay tests.
7. Pilot in **recommend-only** mode with synthetic or mirrored orders and measured human adjudication.
8. Permit bounded execution only after accuracy and escalation thresholds are met and an accountable operator signs off.

## Recommended deployment stages

- **Stage 0 — Demonstration:** current state; synthetic browser simulation.
- **Stage 1 — Internal sandbox:** persistent backend, simulated integrations, authenticated staff.
- **Stage 2 — Shadow mode:** read-only copies of real orders; recommendations compared with human decisions.
- **Stage 3 — Controlled pilot:** low-risk merchant/order segment; strict approval thresholds and rollback.
- **Stage 4 — Limited production:** bounded automatic actions with monitoring and incident response.

## Go-live blockers

All of the following are blockers today: no durable operational store; no real authentication; no transactional inventory control; no production integrations; no security/privacy approval; no operational monitoring or recovery; no validated model/policy release process; no evidence from shadow-mode performance.

The interface can feel production-grade while remaining honest about these boundaries. Visual polish is not evidence of operational readiness.
