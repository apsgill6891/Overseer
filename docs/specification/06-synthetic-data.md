# 6. Synthetic-data generation specification

## Reproducibility and separation

Seed string: `overseer-demo-v1`. A documented hash expands it into independent pseudo-random streams for catalogue, inventory, history, and incidental variation, so adding a field does not reshuffle controlled scenarios.

- `seed/`: immutable reference configuration and generated baseline snapshot.
- `runtime/`: mutable orders, runs, reservations, shipments, approvals, workload, and audit.
- `fixtures/`: scenario labels and expected outcomes available only to tests/development.

Reset drops/recreates only runtime simulation state from the checksummed baseline. It requires confirmation, a simulation-admin permission, and emits a reset record to a separate environment-operation log; prior demo runtime history may be exported before reset.

## Distribution plan

| Data | Rule |
|---|---|
| FCs / merchants / SKUs | Exactly 3 / 3 / 20; intentionally curated |
| Inventory | 0–120 units per SKU/FC; skewed by region, with explicit shortage/scarcity fixtures |
| Historic/operational orders | 200; 70% delivered, 10% active, 8% approval/held, 7% exception/recovered, 5% cancelled/unfulfillable |
| Order size | 65% one line, 25% two, 10% three/four; quantities mostly 1–2 |
| Profiles | Standard 40%, Economy 25%, Prime 20%, Merchant Priority 10%, Replacement 5% |
| Destinations | Canada 60%, US 40%; curated urban, remote, and cross-border zones |
| FC workload | Normal distribution clipped to 35–95%; controlled cutoff/capacity edge cases override |
| Services | At least 2 per carrier where plausible; tariff and transit tables effective-dated |
| Interactive intake | Exactly ten controlled cases per canonical batch; later batches may vary values but preserve scenario classes |

## Generation order and relationships

1. Create reference clock, geographies, carriers/services, packaging.
2. Create FCs, hours, cutoffs, capabilities, capacity.
3. Create merchants, policy/profile versions, products.
4. Create internally consistent inventory positions.
5. Generate 200 historical/active orders and derived shipments/events.
6. Create ten controlled incoming orders by constraint solving/backtracking, not hope-based randomness.
7. Compute expected fixture assertions with an independent oracle.
8. Validate and checksum the snapshot.

## Scenario and state effects

Controlled scenario builders declare preconditions (inventory, time, destination, restriction, disruption) and expected **properties**, not brittle plan IDs. For example, `SC-004` requires the closest FC cutoff to be closed and at least one more distant promise-feasible plan.

Runtime commands update all related aggregates transactionally. Scenario labels remain outside operational API payloads and UI bundles.

## Validation strategy

- Schema, foreign-key, enum, money/currency, timezone, and nonnegative checks.
- Recompute `available = on_hand - reserved - damaged - quarantined - safety_stock`.
- Verify product/merchant ownership, service coverage/restrictions, packaging capability, promise derivation, and allocation uniqueness.
- Replay state histories and compare current state.
- Generate twice and compare canonical checksums.
- Mutation tests deliberately introduce each `BR-*` violation and require rejection.
