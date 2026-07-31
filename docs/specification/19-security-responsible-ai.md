# 19. Security and responsible-AI considerations

## Security controls

- Deny-by-default RBAC with merchant/assignment scope and execution-time authorization.
- Synthetic data only; payment validation uses status/tokens, never card data.
- Encrypt transport/storage in production architecture; secrets stay in environment/config vault, never prompts or audit text.
- Validate schemas, enum/range limits, object versions, idempotency keys, and state transitions at trust boundaries.
- Agents have no arbitrary network, database, filesystem, or code execution. Tool allow-lists and service identities are versioned.
- CSRF/session protection, rate limits, secure headers, dependency scanning (when implementation begins), and privileged-action reauthentication are planned.
- Audit privileged reads, exports, denials, policy publication, role changes, reset, and override.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| Prompt/event injection in merchant notes or carrier notice | Treat text as data; delimit/redact; AI returns typed proposal; deterministic validation |
| Hallucinated service/inventory | Only registered tools provide authoritative facts; evidence reference required |
| Tool confused-deputy action | Scoped service identity and execution-time policy check |
| Approval replay/stale decision | Immutable recommendation version, expiry, aggregate-version revalidation |
| Double allocation/race | Transactional inventory constraint and conflict-driven replan |
| Audit tampering | Append-only permissions, hash chain, backups/export verification |
| Sensitive data leakage in explanation | Field-level redaction and structured reason templates |
| Automation bias | Alternatives/rejections visible; confidence and limits; meaningful approve/reject/hold |

## Responsible AI

AI assistance is optional, labeled, versioned, and measured against the deterministic baseline. The product does not expose hidden chain-of-thought; it presents concise structured reasons, evidence, and decision factors. Confidence is calibrated and never substitutes for a hard constraint.

Monitor outcome differences by merchant, destination region/remote status, and cross-border route for unjustified service/cost disparities. Legitimate cost/coverage differences must be evidence-backed. Human overrides are reviewed for patterns, not assumed correct.

Unsafe or unauthorized actions fail closed. Users can contest and correct data; correction creates a new event and triggers re-evaluation. Policy administrators, not agents, own policy changes.
