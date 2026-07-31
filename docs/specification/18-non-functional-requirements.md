# 18. Non-functional requirements

| ID | Requirement / target |
|---|---|
| `NFR-001` | Deterministic canonical batch produces identical normalized outcomes after reset, excluding IDs/timestamps explicitly derived from run instance |
| `NFR-002` | Common read views p95 <500 ms locally with 200–5,000 orders; command acknowledgement <1 s; simulated planning target <5 s/order, with visible progress |
| `NFR-003` | Ten independent orders may execute concurrently; per-order writes remain serializable and batch is never a transaction boundary |
| `NFR-004` | Mutation commands are idempotent and crash-recoverable; no ambiguous shipment/reservation outcome |
| `NFR-005` | WCAG 2.2 AA target: keyboard access, focus, labels, contrast, text/icon status, reduced motion, screen-reader announcements for live state |
| `NFR-006` | All times use UTC storage plus explicit display timezone; money uses integer minor units and currency; units are explicit |
| `NFR-007` | Structured logs/metrics/traces correlate batch/order/run/command without exposing sensitive fields |
| `NFR-008` | Audit projections can be rebuilt and ledger integrity verified; reset does not silently erase environment-operation history |
| `NFR-009` | Policy/agent/tool versions are deployable and reversible by new version, without rewriting completed runs |
| `NFR-010` | Integration ports isolate storefront, WMS, carrier, geo, estimator, and AI adapters; simulators implement the same contracts |
| `NFR-011` | Graceful degradation: AI unavailable has no correctness impact; estimator fallback is explicit and policy-controlled |
| `NFR-012` | No hidden scenario oracle, secret, payment credential, or raw sensitive address in client bundles, logs, explanations, or exports |

## Capacity and retention assumptions

V1 is a single-tenant local/demo environment sized for 5,000 orders, 50 concurrent run tasks, and 100,000 audit events. Audit records are retained for the life of the demo environment; export/redaction behavior is tested. These are demonstration targets, not production SLAs.

## Usability quality bar

An experienced fulfillment operator should identify why an order is blocked and the required authority/action within two minutes without reading agent chain-of-thought. Explanations cite structured evidence and policy reason codes.
