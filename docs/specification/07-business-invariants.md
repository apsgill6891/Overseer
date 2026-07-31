# 7. Business invariants

Invariants are enforced at command and persistence boundaries, not by agent prose.

| ID | Invariant | Enforcement / failure |
|---|---|---|
| `BR-001` | Available = on-hand − reserved − damaged − quarantined − protected safety stock | Derived value; reject negative result |
| `BR-002` | No inventory component or capacity quantity is negative | Database check and command validation |
| `BR-003` | Every product has exactly one merchant owner | Foreign key; immutable ownership in V1 |
| `BR-004` | Each line product belongs to the order merchant | Intake rejection |
| `BR-005` | FC supports required packaging/handling capability | Candidate eliminated with evidence |
| `BR-006` | Service supports origin, destination, parcel, product, and route | Candidate eliminated |
| `BR-007` | Promise derives from checkout service and cannot be silently extended | Intake provenance; plan constraint |
| `BR-008` | Inventory cannot be allocated twice | Unique active reservation semantics plus transactional lock/version |
| `BR-009` | Every operational transition appends an audit event in the same transaction | Commit fails if event append fails |
| `BR-010` | Audit history cannot be updated/deleted through application commands | Append-only repository and restricted database role |
| `BR-011` | Override records actor, role, reason, prior/result state, evidence, and policy | Override rejected if incomplete |
| `BR-012` | Authorization is evaluated at execution time, not only recommendation time | Revalidate before commit |
| `BR-013` | Approval applies to one recommendation version; material modification invalidates it | New recommendation/request required |
| `BR-014` | Run and command identifiers are idempotent | Duplicate returns original result; mismatched payload rejects |
| `BR-015` | Selected service tariff, policy, profile, and agent/tool versions are preserved | Immutable references on run/plan |
| `BR-016` | Batch failure cannot roll back or corrupt another order lifecycle | Per-order transaction boundary |
| `BR-017` | Departure consumes only that shipment’s active reservations | Atomic reservation/on-hand update |
| `BR-018` | A plan marked feasible has no failed hard constraint or mandatory policy | Derived feasibility; consistency check |
| `BR-019` | Predictive confidence cannot override a failed deterministic constraint | Fixed decision ordering |
| `BR-020` | Cross-border shipments require complete eligibility/customs facts before release | Hold/escalate on missing facts |

## Concurrency example

Two orders may read the same last unit during planning. Reservation uses the inventory version observed by the plan. The first commit succeeds; the second receives a conflict, appends a conflict event, and returns to orchestration for shortage resolution. It must never decrement below zero.

## Correction model

Incorrect reference/runtime facts are corrected by a new effective-dated record or compensating command. The original event remains. A correction links `corrects_event_id`, states the reason and actor, and triggers reevaluation where the affected order is still actionable.
