# 16. Controlled scenario catalogue

All scenarios use operationally plausible fixtures and assert properties rather than hidden exact answers.

| ID | Case / setup | Expected agent behavior | Expected outcome |
|---|---|---|---|
| `SC-001` | Normal Prime, Toronto stock and valid express service | Complete all required checks; prefer reliable single-FC promise plan | Auto-release if within authority |
| `SC-002` | Normal Standard, ground meets promise | Reject unnecessary premium choices through preference/cost comparison | Auto-release ground |
| `SC-003` | Economy, stock at all FCs | Compare feasible set, cost, ground, workload, scarcity | Lowest defensible expected cost; no opaque score |
| `SC-004` | Closest FC cutoff missed | CTP rejects closest same-day pickup; consider next pickup and other FCs | More distant FC if it meets promise; rationale cites cutoff |
| `SC-005` | One line unavailable network-wide after safety stock | Planning invokes shortage goal | Hold/unfulfillable or human-reviewed transfer option; no negative stock |
| `SC-006` | Lines distributed across FCs | Compare split versus complete delayed/alternate options under profile | Split only if policy and promise justify; approval if threshold |
| `SC-007` | Canadian customer, required stock only in Columbus | Apply Cross-Border modifier, customs and service checks | Eligible cross-border plan or hold for missing customs facts |
| `SC-008` | Ground misses promise; air succeeds above authority | Recommend air with cost breakdown | Awaiting approval; no release before approval/revalidation |
| `SC-009` | Lithium/fragile SKU conflicts with package/service | Reject incompatible package/carrier combinations | Safe feasible alternative or hold; unsafe override impossible |
| `SC-010` | Initially released shipment later gets carrier disruption | Subscribe to event; orchestration starts recovery and reevaluates promise | Authorized recovery or approval/escalation with original history intact |

## Scenario timing

Canonical batch time is chosen so cutoff boundaries are unambiguous in each FC timezone. `SC-010` disruption is injected only after its shipment reaches the configured tender/in-transit checkpoint, preventing hidden foreknowledge during initial planning.

## Development-only oracle

Fixture metadata records required goal path, required task checks, prohibited actions, acceptable outcome set, and invariant assertions. The application receives ordinary order/event data only. Build-time tests verify no scenario label or expected outcome is present in production-facing payloads or rendered text.
