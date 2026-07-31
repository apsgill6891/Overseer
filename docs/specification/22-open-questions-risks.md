# 22. Open questions, assumptions, risks, and trade-offs

## Questions requiring approval

| ID | Decision and why it matters | Recommended default |
|---|---|---|
| `Q-001` Is V1 deterministic-first with AI optional, or must an external model be required? A requirement would affect reliability, cost, privacy, and testing. | Approve deterministic-first; add AI only after baseline |
| `Q-002` What does “automatic release” include: reservation/shipment creation only, or simulated pick/pack progression? This defines the human control boundary. | Auto-release may reserve/create shipment; clock-driven pick/pack/ship remains separately observable |
| `Q-003` Approve profile cost/confidence thresholds in document 8. Thresholds materially change approval frequency and scenarios. | Use proposed defaults, configuration-versioned |
| `Q-004` Should Policy Administrator also approve order exceptions? Combining powers weakens separation of duties. | No by default; use Supervisor/Overseer |
| `Q-005` May shortage resolution propose FC-to-FC transfer, and can it execute it? Transfers broaden inventory/workload scope. | Advisory proposal only in V1; never auto-execute |
| `Q-006` How far should post-shipment recovery go? True intercept/reroute behavior is carrier-specific. | One simulated disruption with supported re-service/hold paths; no invented physical intercept |
| `Q-007` Is a display-only returned state sufficient? A complete returns workflow adds a separate domain. | Display-only terminal follow-on in V1 |
| `Q-008` Does the demo need real authentication or a labeled role-switcher? This materially changes security scope. | Labeled seeded role-switcher for local V1; server-side RBAC still enforced |

## Important assumptions

- Three FCs and Canada/US routes are sufficient to show domestic/cross-border decisions without a global trade engine.
- Checkout has already established payment status and accepted promise; FlowShip validates rather than captures payment.
- Transit predictions are reproducible simulated distributions, not carrier guarantees.
- All operational persons, addresses, tracking numbers, merchants, and products are synthetic.
- One parcel per shipment leg is adequate initially; split analysis may create multiple legs.
- Policy versions are effective-dated and pinned per run; current policy is rechecked before mutation for explicitly safety-critical revocations.

## Highest risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Orchestrator is merely rules with theatrical prose | Undermines project thesis | Label deterministic baseline; evaluate adaptive event/recovery behavior; optional AI only where useful |
| “Agent” overuse for arithmetic | Misleading and unsafe | Execution-type labels and deterministic authoritative services |
| Combinatorial plan explosion | Slow/opaque recommendations | Bounded candidate construction with completeness/truncation proof and test fixtures |
| Inconsistent promise/transit/timezone logic | Wrong fulfillment | Immutable promise provenance, UTC instants, property/boundary tests |
| Race-driven double allocation | Operational corruption | Transactional reservation/version constraints and conflict replan |
| Approval becomes rubber stamp | Automation bias | Alternatives, structured reasons, material-change invalidation, role separation |
| Audit captures sensitive data or unverifiable prose | Security/trust failure | Reference/hash evidence, redaction, structured reasons, replay tests |
| Controlled scenarios leak expected answers | Demo becomes fake | Separate fixture oracle and build/API leakage tests |
| Scope expands into WMS/TMS/returns/global trade | Delays coherent V1 | Enforce boundary and adapter interfaces |

## Trade-offs

- Exhaustive plan generation is explainable but can grow rapidly; V1’s small network permits it, with bounded search designed for growth.
- Hash-chained audit improves tamper evidence but not immutability by itself; permissions and backup controls remain necessary.
- A role-switching demo improves review speed but is not production authentication; labeling and server-side authorization prevent conceptual confusion.
- Deterministic orchestration maximizes testability; it is a baseline against which later AI must demonstrate better handling of genuinely ambiguous inputs.

## Approval record

Record owner responses here or in linked decision records. Approval should state the package version/commit and any accepted deviations. Until then, status remains **Draft for product approval**.
