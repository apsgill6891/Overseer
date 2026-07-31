# 15. User role and permission matrix

Permissions are additive but sensitive combinations are logged. Policy publication and approval of a resulting order action should be separated in production-like demonstrations.

| Capability | Task Operator | Goal Supervisor | Orchestration Overseer | Policy Admin | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|
| View orders/runs/evidence | Assigned scope | Goal scope | All operations | Policy context | All read |
| View sensitive synthetic address | Masked | Masked | Required detail | No default | Masked |
| Retry failed task | Assigned, safe retry | Yes | Yes | No | No |
| Correct task input | Propose | Approve in scope | Approve | No | No |
| Pause/resume goal | No | Eligible goals | Yes | No | No |
| Override goal recommendation | No | Within authority | Within authority | No | No |
| Reassign/start recovery workflow | No | Propose | Yes | No | No |
| Approve order exception | No | Within delegated threshold | Within delegated threshold | No by default | No |
| Hold/reject approval | No | Yes | Yes | No | No |
| Edit policy/profile draft | No | Comment | Comment | Yes | No |
| Publish/retire policy version | No | No | No | Yes, dual-confirm | No |
| Change agent definition/version | No | No | Supervision metadata only | No | No |
| Reset simulation | No | No | Explicit simulation permission | No | No |
| Export audit evidence | Assigned | Scope | All | Policy events | All, redacted |

## Permission rules

- Assignment and merchant/region scope further constrain roles.
- Approval eligibility is evaluated from request rule, amount, merchant, action, and current role—not page access.
- Users cannot approve their own policy publication or an order action they materially modified where separation-of-duty mode applies.
- Overrides cannot bypass inventory, safety, customs, audit, or authorization invariants.
- “Modify” approval means selecting another still-feasible plan or changing permitted operational fields; it triggers revalidation and usually a new recommendation version.
- All denied attempts and privileged reads/exports are audited.

V1 has seeded synthetic users for each role and a role-switching demo harness clearly labeled as simulation; it must not be mistaken for production authentication.
