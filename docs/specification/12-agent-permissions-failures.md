# 12. Agent permissions and failure conditions

## Capability boundaries

| Actor | Read | Propose | Mutate |
|---|---|---|---|
| Task capability | Declared narrow inputs | Typed fact/result | Never |
| Goal agent | Order, policy, tool outputs | Plans/recommendation/escalation | Never directly |
| Orchestrator | Run graph and required operational context | Goal transitions and typed commands | Only through authorized execution service |
| AI adapter | Redacted minimum context | Interpretation/explanation | Never |
| Execution service | Recommendation and current authoritative state | N/A | Reservation, workload, shipment, valid state, audit atomically |

## Failure policy

| Failure | Behavior | Retry |
|---|---|---|
| Invalid input/schema | Fail task/hold order; request correction | No automatic retry |
| Stale inventory/capacity | Re-read and replan | Up to 2 with jitter, then escalate |
| Reservation conflict | Release partial transaction, start shortage/replan | Up to 2 |
| Read-only dependency timeout | Mark unknown, retry at checkpoint | 2 attempts; no guessed value |
| Mutating command timeout | Query by idempotency key before retry | Never blind retry |
| Predictive estimator unavailable | Use approved conservative deterministic table if policy allows and label degraded | Otherwise hold |
| AI adapter unavailable/invalid | Continue deterministic path; no operational outage | No required retry |
| Policy/profile missing or ambiguous | Stop unsafe execution | Human/admin correction |
| No promise-feasible plan | Start shortage/recovery, then escalate/unfulfillable | No loop without changed evidence |
| Unauthorized command | Reject and audit | No |
| Run deadline exceeded | Pause at checkpoint and escalate | Manual resume/retry |

## Loop, timeout, and degradation controls

Each orchestration run has a maximum of 12 goal transitions and three total replans absent changed external evidence. Repeated identical state/evidence produces a loop-detected hold. Read task default timeout is 3 simulated seconds; goal 30; orchestration planning 60. Values are configuration defaults, not wall-clock promises.

Pause is cooperative at safe checkpoints. A running transaction completes or rolls back before pause becomes effective. Cancellation releases uncommitted/eligible reservations by compensating command and preserves history.

## Unsafe failures

Inventory invariant violation, audit append failure, policy engine failure, corrupted version reference, or authorization service failure is fail-closed: no release or shipment mutation. An operational alert and audit attempt are produced; if the audit store itself is unavailable, the command transaction fails.
