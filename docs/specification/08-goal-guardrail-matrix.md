# 8. Goal profiles and guardrails

Exact money thresholds are proposed defaults pending `Q-003`; values are CAD-equivalent after deterministic FX snapshot conversion.

| Profile | Primary / secondary objective | Promise & confidence | Split / air | Cost and release authority | Approval / escalation |
|---|---|---|---|---|---|
| Prime | Meet fastest accepted promise / reliability, single FC | Hard promise; ≥95% on-time | Split allowed only to protect promise; air allowed | Auto ≤$35 and ≤25% of order value | Upgrade >$35, confidence below 95%, no feasible plan |
| Standard | Meet promise at lowest expected cost / ground, single FC | Hard promise; ≥90% | Split if total expected cost + service justify; air only to protect promise | Auto ≤$25 and ≤20% | Air, split above $12 premium, low confidence |
| Economy | Meet wider promise at lowest expected cost / balance FC | Hard promise; ≥85% | Split normally disallowed; air disallowed unless human-approved recovery | Auto ≤$18 and ≤18% | Any air/split, low confidence |
| Replacement | Restore customer outcome quickly / reliability | Replacement promise is explicit; ≥95% | Split/air allowed | Auto ≤$50 with service-case reference | High value, missing case, policy exception |
| Merchant Priority | Meet merchant-defined promise / merchant preference order | Hard promise; ≥merchant threshold (min 90%) | Merchant-configured | Auto ≤merchant limit, maximum $60 default | Merchant override, high cost, scarcity conflict |

## Cross-Border route modifier

Adds customs eligibility, harmonized code/country-of-origin completeness, de minimis/duties estimate, restricted-party simulation check, importer terms, supported international service, border-delay distribution, and a 3-point confidence uplift requirement capped at 98%. Missing required customs data is a hard hold. Country routing is not optimized merely to avoid compliance.

## Mandatory guardrails

| Guardrail | Applies to | Result |
|---|---|---|
| Inventory integrity and ownership | All goals | Stop mutation; replan |
| Accepted promise | Planning/recovery | Reject late plan; escalate if none |
| Packaging/product/carrier safety | Planning/recovery | Reject candidate; unsafe override prohibited |
| Customs eligibility | Cross-border | Hold until complete or mark unfulfillable |
| Role and cost authority | Release/approval/override | Request eligible human decision |
| Capacity/cutoff | Planning | Reject or use explicit next pickup; never invent pickup |
| Data quality | All | Escalate when required fact missing/stale |
| Version pinning | Runs | Continue pinned version unless authorized restart/migration |

## Goal workflows

| Goal | Entry | Required checks | Success | Failure/escalation |
|---|---|---|---|---|
| Fulfillment planning | Valid received order | validation, ATP/CTP, packaging, service, estimate, cost, customs, policy | Defensible plan authorized or approval requested | shortage goal, hold, or unfulfillable |
| Inventory-shortage resolution | No complete feasible allocation / reservation conflict | alternate FC, permitted split, safety stock, transfer feasibility (advisory), promise/cost | New feasible plan or explicit resolution | human decision/unfulfillable; V1 does not auto-replenish |
| Delivery recovery | Disruption threatens released/shipped order | current location/status, remaining promise, alternate services/intercept feasibility, cost/authority | Recovery action within authority or approval | hold/escalate; never claim physical intercept unsupported by simulation |

Preferences use ordered comparison: promise confidence band → completeness/split → expected cost → reliability → ground → scarce-stock protection → workload. The UI presents this vector, not a blended score.
