# PROJECT OVERSEER — efficiency, requirements, and design review

Assessment date: 2026-07-30

## Executive assessment

The deployed site is technically efficient for a static simulation: approximately
103 KB of first-party HTML, CSS, and JavaScript, no framework bundle, and an
observed mean HTML response time of 148 ms over five requests. The external web
font dependency was removed during this review, leaving only first-party static
assets for the application experience.

The interaction model is stronger after adding guided setup, live architecture,
plain-language evidence, and progressive disclosure. It is still a simulation,
not a production fulfillment system. See
[production readiness](production-readiness-review.md).

## Design benchmarks applied

These are principles, not copied visual treatments:

- **Linear:** “simple first, then powerful,” use familiar language, remove busy
  work, and do not give secondary UI attention it has not earned. OVERSEER now
  keeps the primary workflow prominent and collapses supporting network detail.
  Sources: [Linear principles](https://linear.app/method/introduction) and
  [calmer interface](https://linear.app/now/behind-the-latest-design-refresh).
- **Atlassian:** use consistent information, success, warning, and error
  messages; reserve banners for critical system-level information; put
  section-specific messages beside the affected work.
  Source: [Atlassian message design](https://atlassian.design/foundations/content/designing-messages/).
- **IBM Carbon:** give operational tables enough width, use consistent row
  heights, support selection and batch actions, and progressively disclose
  supplementary information through expansion or a dedicated panel.
  Source: [Carbon data-table guidance](https://carbondesignsystem.com/components/data-table/usage/).

## Requirement coverage

| Requirement area | Current coverage | Remaining gap |
|---|---|---|
| Ten-order controlled intake | Implemented | Orders are fixed browser fixtures |
| Select one, many, or all | Implemented | None for simulation |
| Goal and limit review | Implemented | Configuration is not persisted/versioned server-side |
| Three agent levels | Implemented and visible | No independently deployed agent services |
| Per-order lifecycle | Implemented in memory | No durable restart or cross-session recovery |
| Live execution hierarchy | Implemented as staged simulation | Timing does not represent external systems |
| Inputs, outputs, evidence, prohibited actions | Implemented in execution room | Evidence references are illustrative |
| Plan alternatives | Count and selected plan shown | Complete alternative plans and rejection evidence still required |
| Human approvals | Implemented in memory | No authenticated identity, delegation, or separation of duties |
| Policies and guardrails | Visible | Editing, validation, publishing, and effective dating are not operational |
| Agent registry | Grouped by three levels | Version management and deployment controls are illustrative |
| Audit centre | Append-only during session | No immutable persistent ledger or export verification |
| Reset capability | Implemented | Refresh/reset is browser-local |
| Approximately 200 historic orders | Metrics imply history | Full generated dataset and searchable records are not implemented |
| Shipment/tracking lifecycle | Partially represented | No complete pick, pack, tender, departure, delivery event engine |
| Recovery workflow | Demonstrated entry and rationale | No durable recovery execution or carrier action |
| Role matrix | Role labels and navigation cues | No authentication or server-side authorization |
| Transactional inventory | Design documented | Not implemented |

## Efficiency findings

### Strengths

- Small static payload and no framework runtime.
- No production dependencies or build chain.
- Narrow seeded dataset makes planning deterministic and reproducible.
- Batch execution has independent order run objects.
- Progressive agent evidence avoids loading separate pages.

### Risks and improvements

1. The browser rerenders full run lists and details with `innerHTML`. This is
   acceptable for ten orders but must be replaced with incremental rendering or
   a component architecture before scaling.
2. Runtime state is memory-only. Persistence and a query model are mandatory
   before larger datasets.
3. All logic is in one JavaScript file. A production build should separate
   domain rules, orchestration, views, and adapters with automated tests.
4. Tables lack production sorting, pagination, saved filters, and virtualization.
5. Timed execution stages are illustrative and must be driven by durable events
   in a real system.
6. Accessibility has keyboard focus, labels, text statuses, and reduced visual
   dependence on color, but still requires formal screen-reader, zoom, contrast,
   and keyboard testing.

## Recommended next build

Do not add more dashboard decoration. The next meaningful milestone is an
authenticated internal sandbox with a deterministic backend, transactional
inventory, persistent audit events, all 200 seeded orders, complete alternative
plans, and the existing UI driven by real server events.
