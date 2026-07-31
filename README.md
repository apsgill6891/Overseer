# PROJECT OVERSEER

A working, deterministic-first simulation of an explainable agentic e-commerce fulfillment control centre for FlowShip Fulfillment.

## Choose how to run it

### Public demonstration

Open `index.html` directly in a modern browser, or serve the repository with any static web server.

### Governed internal sandbox

This repository now includes a zero-dependency Python service with persistent
SQLite records, server-side roles, idempotent execution requests, approvals,
and a tamper-evident audit chain:

```powershell
$env:OVERSEER_DEV_MODE = "1"
python server/overseer_server.py
```

Then open `http://127.0.0.1:8080`. See
[`docs/enterprise-sandbox.md`](docs/enterprise-sandbox.md) for the API,
security boundary, and the remaining release gates.

## Demo flow

1. Open **Order Intake**.
2. Select one or more of the ten controlled orders.
3. Choose **Run agents** and confirm the execution mode.
4. Inspect the independent runs, evidence, recommendations, approvals, order states, and audit history.
5. Use the reset control to restore `overseer-demo-v1`.

The static browser application deliberately keeps inventory arithmetic,
constraints, authority, and state transitions deterministic. It stores mutable
demo state only in memory and resets on reload. The governed internal sandbox
is the first enterprise foundation; it does not make the GitHub Pages demo a
production fulfillment system.

The complete approved product specification is under [`docs/specification`](docs/specification/README.md).

The honest assessment of what is still required before a company can use this
for live fulfillment is in
[`docs/production-readiness-review.md`](docs/production-readiness-review.md).

The measured efficiency, design benchmark, and requirement-coverage audit is in
[`docs/efficiency-and-design-review.md`](docs/efficiency-and-design-review.md).

## GitHub Pages

The included Pages workflow publishes the repository root when `main` or `master` is pushed and Pages is configured to use **GitHub Actions** as its source.
