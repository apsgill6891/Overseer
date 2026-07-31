# PROJECT OVERSEER

A working, deterministic-first simulation of an explainable agentic e-commerce fulfillment control centre for FlowShip Fulfillment.

## Run locally

Open `index.html` directly in a modern browser, or serve the repository with any static web server.

## Demo flow

1. Open **Order Intake**.
2. Select one or more of the ten controlled orders.
3. Choose **Run agents** and confirm the execution mode.
4. Inspect the independent runs, evidence, recommendations, approvals, order states, and audit history.
5. Use the reset control to restore `overseer-demo-v1`.

The static browser application deliberately keeps inventory arithmetic, constraints, authority, and state transitions deterministic. It stores mutable demo state only in memory and resets on reload.

The complete approved product specification is under [`docs/specification`](docs/specification/README.md).

The honest assessment of what is still required before a company can use this
for live fulfillment is in
[`docs/production-readiness-review.md`](docs/production-readiness-review.md).

## GitHub Pages

The included Pages workflow publishes the repository root when `main` or `master` is pushed and Pages is configured to use **GitHub Actions** as its source.
