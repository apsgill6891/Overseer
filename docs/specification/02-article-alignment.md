# 2. Article-alignment analysis

## What the article contributes

The supplied McKinsey transcript frames agentic AI as an **execution layer** across fragmented systems, not merely another insight dashboard. It distinguishes:

- `ART-001` Task agents: atomic, modular, repeatable work.
- `ART-002` Goal agents: a well-defined sequence of tasks toward an outcome.
- `ART-003` Orchestration agents: determine and revise a less-defined sequence, coordinating thinking, doing, and repeating.
- `ART-004` Value comes from end-to-end workflow redesign, not isolated pilots.
- `ART-005` Accountability requires accuracy, explainability, auditability, governance, guardrails, and human-in-the-loop controls.
- `ART-006` Human work shifts from repetitive execution toward supervision and expert judgment.
- `ART-007` Order management combines ATP/CTP, transportation feasibility, cost-to-serve, trade-offs, and bounded autonomous execution.

## Product interpretation

| Article concept | OVERSEER interpretation | Guard against misrepresentation |
|---|---|---|
| Atomic task agent | Versioned capability returning facts/calculations/evidence | A deterministic function may be shown as a task capability, clearly labeled deterministic |
| Goal agent | Bounded workflow with required checks and completion criteria | A static workflow is not described as open-ended intelligence |
| Orchestration | Chooses goal, profile, checkpoint, recovery, and human route based on events and run state | Rules-only dispatch is the baseline orchestrator, not claimed as adaptive AI |
| Autonomous execution | Transactional commands within explicit authority | Recommendation does not imply permission |
| Fuzzy data readiness | Data-quality indicators and safe escalation | Fuzzy inputs never relax invariants |
| Agent supervisor | Role-specific inspection, intervention, and performance views | Humans retain accountable authority |

## Challenges and revisions

1. The transcript offers a conceptual taxonomy, not a technical or regulatory specification. OVERSEER adds state machines, deterministic enforcement, versioning, evidence, and transactional semantics.
2. “Agent” must not imply an LLM. Most task capabilities should be deterministic services. The UI identifies execution type: deterministic, predictive, or AI-assisted.
3. Orchestration intelligence must be evaluated by changed-condition handling, recovery selection, and authority compliance—not prose quality.
4. “Autonomy” is bounded by policy and cost authority. The accepted customer promise cannot be traded away.
5. Reported cost and productivity improvements are external examples, not claims PROJECT OVERSEER can reproduce.

## AI boundary

V1 can run entirely without an external model using a policy-aware orchestration state machine and structured explanations. A later AI API may:

- normalize unstructured disruption notices;
- propose a goal/recovery path when known playbooks conflict;
- summarize evidence in plain language;
- suggest novel alternatives for human review.

It may not calculate inventory/cost, enforce policy, mutate operational state, approve its own proposal, or bypass deterministic validation. AI output is untrusted input to the same validators and authority checks.
