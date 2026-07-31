# Phase 2 operations package

This directory contains the controls needed to move PROJECT OVERSEER from an
internal sandbox to a read-only company pilot.

## Identity

Put the service behind an OIDC-aware reverse proxy connected to the company's
identity provider. The proxy must:

1. Remove all incoming `X-Overseer-*` headers.
2. Authenticate the user and map directory groups to one role: `viewer`,
   `operator`, `approver`, `auditor`, or `admin`.
3. Inject the verified user, role, and shared proxy secret.
4. Require TLS and secure, HTTP-only, same-site cookies.

Operator and approver groups should not overlap in the controlled pilot.

## Storage

`server/postgres/schema.sql` is the PostgreSQL migration contract. Apply it to
a managed private PostgreSQL instance with encryption, point-in-time recovery,
automated backups, and separate application/migration identities.

The current Python runtime remains on SQLite until the PostgreSQL adapter is
implemented and exercised in CI. This is deliberate: configuration must not
silently claim PostgreSQL while writing elsewhere.

## Pilot mode

Use `mode: shadow`. It records the recommendation but does not change order
state or create a fulfillment write. Bounded mode fails closed until an admin
explicitly enables the server control with a documented reason.

Minimum shadow-mode exit criteria:

- 30 consecutive days and at least 10,000 representative orders.
- At least 99.5% technical completion.
- At least 98% agreement with accepted human outcomes by segment.
- Zero policy or authority bypasses.
- Every disagreement categorized and reviewed.
- Security, privacy, operations, and business owners sign off.

## Monitoring and alerts

Probe `/api/health` for liveness and `/api/readiness` for traffic readiness.
Preserve `X-Correlation-ID` across the proxy, service, adapters, and logs.

Alert immediately when:

- readiness fails or the audit chain becomes invalid;
- bounded execution is enabled outside an approved change window;
- authentication failures spike;
- duplicate/conflicting idempotency keys rise;
- approval age or run latency exceeds the pilot SLO.
