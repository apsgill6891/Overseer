# Enterprise sandbox: Phases 1–2

This phase adds a governed application service beside the public GitHub Pages
simulation. It is intentionally an **internal sandbox**, not a production
fulfillment system.

## What is now real

- Durable order, run, approval, and audit records in SQLite.
- Server-enforced operator, approver, viewer, auditor, and admin roles.
- Separation between execution and approval permissions.
- Mandatory idempotency keys on run creation.
- Atomic writes and optimistic order versions.
- A tamper-evident SHA-256 audit chain with a verification endpoint.
- Security headers, body limits, parameter validation, and structured logs.
- A trusted-identity-proxy boundary for future OIDC/SAML integration.
- A deterministic API with no third-party runtime dependencies.
- Shadow mode that records recommendations without changing order state.
- A server-side bounded-execution kill switch that fails closed.
- Liveness and readiness endpoints with correlation IDs.
- A PostgreSQL schema contract and pilot operations package.

## Run the internal sandbox

Requires Python 3.11 or newer.

```powershell
$env:OVERSEER_DEV_MODE = "1"
python server/overseer_server.py
```

Open `http://127.0.0.1:8080`. The database is created at
`server/data/overseer.db`. Development mode defaults to a local admin identity
and must never be used on a shared network.

Check the governed service:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/health
Invoke-RestMethod http://127.0.0.1:8080/api/session
Invoke-RestMethod http://127.0.0.1:8080/api/orders
```

Create an idempotent recommend-only run:

```powershell
$headers = @{ "Idempotency-Key" = "pilot-run-000001" }
$body = @{
  order_ids = @("FS-10421")
  mode = "shadow"
  goal_profile = "balanced"
  confidence_limit = 90
  cost_limit = 35
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8080/api/runs `
  -Headers $headers -ContentType "application/json" -Body $body
```

## Production identity boundary

Outside development mode every API request is rejected unless a trusted
identity-aware proxy supplies:

- `X-Overseer-Proxy-Secret`
- `X-Overseer-User`
- `X-Overseer-Role`

The service compares the proxy secret in constant time. The proxy must remove
incoming copies of these headers, authenticate with the company's OIDC or SAML
provider, and inject verified values. Never expose the service directly.

## Still required before a company pilot

1. Implement and test the PostgreSQL runtime adapter against the included
   schema contract.
2. Deploy behind the company's identity-aware proxy and secrets manager.
3. Add CSRF protection when browser writes are wired to the API.
4. Connect a read-only staging adapter for OMS, WMS, inventory, and carrier
   data; validate schemas and replay behavior.
5. Add metrics, traces, alerts, backups, restore tests, and an incident runbook.
6. Add agent/policy version tables and evaluation gates.
7. Run threat modeling, privacy review, accessibility testing, load testing,
   and disaster-recovery exercises.
8. Complete shadow-mode comparison before permitting bounded writes.

## Recommended release gates

| Gate | Required evidence |
|---|---|
| Internal sandbox | Tests pass; audit chain verifies; dev mode is local only |
| Shadow mode | 30 days and 10,000 decisions compared with human outcomes |
| Controlled pilot | SSO, PostgreSQL, observability, backups, incident owner |
| Bounded execution | Approved adapters, rollback, dual control, kill switch |
| Production | SLOs met, DR tested, security/privacy approvals complete |
