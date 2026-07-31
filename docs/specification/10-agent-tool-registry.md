# 10. Agent tool registry

| ID | Tool | Type | Reads / returns | Mutation | Used by |
|---|---|---|---|---|---|
| `AG-T01` | Validate order/payment | Deterministic | order, payment status → issues | None | Planning |
| `AG-T02` | Validate address/zone | Deterministic curated geo | address → normalized zone, remote flag, quality | None | Planning/recovery |
| `AG-T03` | Query ATP | Deterministic | SKU/FC → inventory components/version | None | Planning/shortage |
| `AG-T04` | Validate CTP/cutoff | Deterministic | FC workload/hours/time → eligible pickup | None | Planning |
| `AG-T05` | Select packaging candidates | Deterministic rules | lines/FC capability → packages/rejections | None | Planning |
| `AG-T06` | Query carrier services | Deterministic | route/parcel/restrictions → services | None | Planning/recovery |
| `AG-T07` | Estimate delivery | Predictive simulation | service, time, zone → distribution/confidence | None | Planning/recovery |
| `AG-T08` | Calculate expected cost | Deterministic from estimates | plan components → itemized money | None | All goals |
| `AG-T09` | Validate cross-border | Deterministic policy | goods/route/docs → eligibility/issues/duties | None | Planning/recovery |
| `AG-T10` | Evaluate policies/guardrails | Deterministic | plan, versions, actor → results/authority | None | All |
| `AG-T11` | Enumerate plans | Deterministic bounded search | candidates → complete plan set/truncation proof | None | Planning/shortage |
| `AG-T12` | Reserve and release | Transactional command | recommendation/version/idempotency → reservation/shipment | Yes | Orchestrator only |
| `AG-T13` | Manage approval | Transactional command | request/decision/actor → new state | Yes | Human/API only |
| `AG-T14` | Advance simulation | Transactional command | clock/event → operational transitions | Yes | Authorized simulator |
| `AG-T15` | Get tracking state | Deterministic simulation | shipment → current event/location | None | Recovery |
| `AG-T16` | Append audit | Infrastructure | structured event → event id/hash | Append only | All services |
| `AG-T17` | AI interpret/explain | Optional AI | redacted structured context/text → typed proposal | None | Orchestrator |

## Registration requirements

Every tool version declares JSON schema, determinism class, owner, timeout, retry policy, data classification, side effects, permission scope, idempotency behavior, evidence provenance, and health status. Goal agents call only allow-listed tools. Tool output is schema-validated and size-limited.

No agent can call arbitrary network, filesystem, SQL, or code-execution tools. `AG-T12` and `AG-T14` revalidate all invariants regardless of upstream outputs.
