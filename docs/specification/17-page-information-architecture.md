# 17. Page-level information architecture

Common patterns: table-first queues, persistent filters, status text plus icon/colour, evidence drawer, version badges, linked order/run/audit context, skeleton loading, actionable errors with correlation IDs, and success confirmation naming the committed change.

| ID / area | Purpose and primary users | Required information / actions | State and audit requirements |
|---|---|---|---|
| `UI-001` Command Centre | Attention-first operations overview; Overseer/Supervisor | approvals, blocked/failed runs, disruptions, SLA risk; jump, hold, resume | No decorative KPIs; explain stale/empty data; commands audited |
| `UI-002` Order Intake | Receive and select ten orders; Overseer | order/promise/profile/issues; generate batch, select, run, confirm mode/profile | Loading prevents duplicate generation; partial validation visible; intake/run events |
| `UI-003` Live Runs | Observe hierarchy; all operational roles | batch/order tree, orchestration→goal→task, checkpoint, retries/evidence; pause/resume/retry by role | Streaming reconnect and stale indicator; every command/result audited |
| `UI-004` Orders | Search lifecycle and plan; all | lines, promise, allocation, package, service, shipment, alternatives, history | Empty/search/error; operational edits only through typed commands |
| `UI-005` Agent Registry | Supervise capabilities/versions; operators/supervisors/overseer | type, owner, tools, version, health, accuracy, failures | No agent “chat”; config/version actions audited |
| `UI-006` Goal Management | Inspect goal definitions/runs; Goal Supervisor | entry/success criteria, required tasks, profiles, failures; pause/retry/override | Difference between goal and profile explicit |
| `UI-007` Policy & Guardrails | Govern versioned configuration; Policy Admin | drafts, diffs, thresholds, permissions, effective date; validate/publish/retire | Invalid config explained; publish confirmation and audit |
| `UI-008` Approval Queue | Decide exceptions; eligible supervisors/overseer | immutable recommendation, alternatives, cost/promise/evidence, authority; approve/reject/modify/hold | Expired/stale clearly disabled; reason required; decision audited |
| `UI-009` Audit Centre | Reconstruct decisions; Auditor/all scoped | timeline, filters, state diff, actor/version/evidence, export | Append-only language; unavailable evidence shown, never fabricated |

## Navigation and relationships

Global primary navigation follows the nine areas. Order and run IDs deep-link bidirectionally; an approval opens the exact recommendation version; any operational row can open its audit timeline. Role limits hide unavailable actions but explanatory read-only permission messaging remains where useful.

## Responsive behavior and motion

Desktop is primary (1280px+); at narrower widths tables preserve critical identifiers/status/actions and move secondary evidence into drawers. Motion indicates queued→running→terminal transitions and newly appended events, respects reduced-motion preferences, and never simulates “AI thinking.”
