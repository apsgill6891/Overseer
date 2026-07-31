# 11. Agent inputs and outputs

## Shared run envelope

Inputs include `run_id`, `order_id`, `batch_id`, `correlation_id`, `attempt`, simulation time, actor/execution mode, pinned agent/tool/policy/profile versions, and immutable input references. Outputs include status, typed result, evidence refs, data-quality flags, errors, duration, and output hash.

## Orchestration contract

**Input:** order snapshot; triggering event; current lifecycle; prior goal results; pending approvals; authority context.  
**Output:** selected goal and profile/modifiers; rationale; checkpoint; commands proposed; authorization outcome; escalation; next-event subscriptions.

The orchestrator cannot output a free-form executable command. A proposed action must match a registered typed command and pass transition/policy validation.

## Goal contract

**Input:** goal definition/version, success criteria, order/run context, constraints/preferences, tool allow-list.  
**Output:** required-check ledger, alternative plans or recovery options, recommendation, unresolved issues, escalation, and completion status.

Goal correctness requires all mandatory checks to appear once with current evidence; “successful” prose without the ledger is invalid.

## Task contract

Each task returns:

```json
{
  "task_run_id": "opaque-id",
  "capability": "inventory-availability",
  "execution_type": "deterministic",
  "status": "succeeded",
  "result": {"fc": "YYZ1", "sku": "SKU-001", "available": 8, "version": 14},
  "evidence": ["inventory-position:YYZ1:SKU-001:v14"],
  "quality": {"complete": true, "fresh_as_of": "simulation-instant"},
  "errors": []
}
```

## Plan and recommendation contract

A plan contains allocations, package(s), service(s), pickup/departure, delivery distribution, promise result, itemized expected cost, every hard constraint/policy result, ordered preference vector, evidence, and generator version. Rejected plans are retained with reason codes.

A recommendation references one immutable plan and states why it dominates the remaining feasible plans, authority status, expiry, and conditions requiring revalidation. Approval never targets mutable “latest plan.”

## Error contract

Errors have stable code, category (`validation`, `conflict`, `dependency`, `timeout`, `policy`, `authorization`, `internal`), retryability, safe user message, technical correlation, partial-result status, and recommended next checkpoint. Secrets and raw stack traces are excluded from user/audit payloads.
