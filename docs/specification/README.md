# PROJECT OVERSEER — specification package

Status: **Draft for product approval**  
Scope: specification only; no application, database, production data, dependencies, or deployment.

PROJECT OVERSEER is a simulated internal fulfillment control centre for FlowShip Fulfillment. It demonstrates how deterministic operational tools, bounded goal workflows, adaptive orchestration, and human authority can work together without presenting ordinary rules as AI.

## First-version boundary

V1 covers order receipt through shipment release, simulated pick/pack/ship progression, one post-release carrier-disruption recovery path, approvals, and an immutable audit history. It uses three FCs, three merchants, about 20 SKUs, five carrier networks, 200 seeded historical/operational orders, and controlled ten-order batches. It excludes real integrations, returns optimization, purchasing, manufacturing, demand planning, carrier procurement, and autonomous policy changes.

The application must remain useful without an external AI API. All arithmetic, constraints, permissions, transitions, reservations, and policy enforcement are deterministic. A later AI adapter may interpret fuzzy events, propose recovery strategies, and produce explanations; it never becomes the system of record or final authority.

## Documents and recommended review order

1. [Product requirements](01-product-requirements.md)
2. [Article alignment](02-article-alignment.md)
3. [Operating model](03-operating-model.md)
4. [Domain glossary](04-domain-glossary.md)
5. [Entity and relationship model](05-entity-relationship-model.md)
6. [Synthetic-data specification](06-synthetic-data.md)
7. [Business invariants](07-business-invariants.md)
8. [Goal and guardrail matrix](08-goal-guardrail-matrix.md)
9. [Agent architecture](09-agent-architecture.md)
10. [Agent tool registry](10-agent-tool-registry.md)
11. [Agent inputs and outputs](11-agent-inputs-outputs.md)
12. [Agent permissions and failures](12-agent-permissions-failures.md)
13. [State machines](13-state-machines.md)
14. [Audit-event specification](14-audit-events.md)
15. [Role and permission matrix](15-role-permissions.md)
16. [Controlled scenario catalogue](16-controlled-scenarios.md)
17. [Page information architecture](17-page-information-architecture.md)
18. [Non-functional requirements](18-non-functional-requirements.md)
19. [Security and responsible AI](19-security-responsible-ai.md)
20. [Acceptance and testing](20-acceptance-testing.md)
21. [Implementation phases](21-implementation-phases.md)
22. [Open questions, assumptions, risks, and trade-offs](22-open-questions-risks.md)

## Traceability convention

IDs are stable and link concepts across the package:

- `ART-*` article-derived principle
- `PR-*` product requirement
- `BR-*` business rule/invariant
- `AG-*` agent or tool
- `SC-*` controlled scenario
- `UI-*` product area
- `AC-*` acceptance criterion
- `Q-*` approval question

The canonical crosswalk is in [acceptance and testing](20-acceptance-testing.md#traceability-crosswalk). Mermaid diagrams describe logical behavior, not implementation choices.

## Approval gate

No implementation begins until the owner resolves the material questions in [document 22](22-open-questions-risks.md#questions-requiring-approval) and explicitly approves this package.
