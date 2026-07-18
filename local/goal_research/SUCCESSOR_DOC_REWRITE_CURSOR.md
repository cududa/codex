# Successor-Doc Rewrite Cursor

This cursor is operational only. It is not Goal authority and does not replace
the drafting protocol, topology blueprint, source corpus, or successor docs.

- Current successor doc: none; successor-doc set drafted.
- Current stage: 8. Advance cursor complete for
  `goal-readiness-and-execution-handoff.md`
- Completed successor docs: `goal-authority-behavior.md`,
  `goal-cadence-contract.md`,
  `goal-durable-state-and-pending-intent.md`,
  `goal-final-request-input.md`,
  `goal-idle-history-lifecycle.md`,
  `goal-recorded-request-evidence.md`,
  `goal-request-repair-and-artifact-classification.md`,
  `goal-projection-reconstruction-and-raw-history.md`,
  `goal-extension-lifecycle-and-reachability.md`,
  `goal-test-prep-and-replacement-proof.md`,
  `goal-readiness-and-execution-handoff.md`
- Active source inputs: none.
- Coverage checks completed: `goal-authority-behavior.md` passed source and
  traceability coverage. Grounding-truth title, Purpose, Core Truth, Required
  Active Steering Shape, Durable State, Anti-Patterns, Acceptance Standard,
  and Conformance Requirements are covered as canonical behavior text, local
  proof obligations, or pointers to owning seam docs. Primary-cadence
  Non-Negotiable Shape and Current Authority are covered as canonical/local
  behavior text with cadence and final-input pointers. Final-input Core Rule
  is covered as a behavior rule plus pointer to final mechanics. Evidence,
  extension, fake-shim, repair/classifier, test-prep, and open-design rows
  whose target homes include the behavior surface are covered as local
  negative rules, local proof obligations, or pointer-only dependencies.
  `goal-cadence-contract.md` passed source and traceability coverage. It
  accounts for Initial, ObjectiveUpdated, BudgetLimit, automatic Continuation,
  supersedence, ordinary user-turn limits, cadence-required authority, repair
  not being cadence, active durable state alone not requiring steering,
  metadata-only same-turn recheck, pending intent survival, resume as
  hydration, retry/follow-up boundaries, feature/collaboration delivery gates,
  and local proof obligations. Durable facts, pending intent storage, exact-key
  consumption, final-input commit, idle stage order, history key/watermark,
  classifier repair mechanics, evidence persistence, extension lifecycle, and
  the replacement test matrix are routed to their owning successor docs by
  pointer or local reminder only.
  `goal-durable-state-and-pending-intent.md` passed source and traceability
  coverage. It accounts for durable Goal facts, durable facts version, pending
  Initial/ObjectiveUpdated/BudgetLimit intent, atomic facts-plus-intent
  mutations, mechanical supersedence cleanup, exact-key consumption,
  state-owned Continuation suppression record storage, resume reload
  requirements, app-server/extension producer metadata boundaries, and state
  non-ownership. Final request-input shaping, cadence selection, idle
  lifecycle, history-key computation, recorded evidence, request repair,
  extension lifecycle, and the replacement test matrix are routed to their
  owning successor docs by pointer or local reminder only.
  `goal-final-request-input.md` passed source and traceability coverage. It
  accounts for the logical final `Vec<ResponseItem>` before `Prompt.input`,
  per-attempt shaping, feature/collaboration eligibility gates, selected item
  identity, developer-role insertion or verification, cleanup inside shaping,
  previous-response/model-context proof limits, retry/follow-up shaping,
  Created-event commit, commit metadata, item and request fingerprints,
  evidence metadata production, current-turn committed carry, WebSocket full
  logical-input boundaries, stale metadata handling, and adapter
  non-ownership. Behavioral authority, cadence due rules, durable storage,
  idle/history selection, evidence persistence, classifier/projection
  semantics, extension lifecycle, and test matrix ownership are routed to
  their owning successor docs by pointer or local reminder only.
  `goal-idle-history-lifecycle.md` passed source and traceability coverage.
  It accounts for legal idle callers, required stage order, pending non-Goal
  work precedence, pending durable Initial/ObjectiveUpdated/BudgetLimit
  delivery from idle, automatic Continuation selection, Goal-owned synthetic
  request metadata, lock/reservation/stale synthetic abort behavior, resume
  hydration, external mutation and same-turn metadata routing,
  model-visible history key shape, eligible progress projection,
  Continuation suppression comparison/reconstruction,
  compaction/reconstruction effects, and local proof obligations. Durable
  facts, pending-intent storage, exact-key consumption, final request-input
  insertion and Created-event commit advancement, evidence carrier
  persistence, classifier/projection/raw mechanics, extension lifecycle, and
  the replacement test matrix are routed to their owning successor docs by
  pointer or local reminder only.
  `goal-recorded-request-evidence.md` passed source and traceability
  coverage. It accounts for structured committed Goal request evidence as
  metadata only, carrier shape, schema version, thread/turn/attempt identity,
  Goal id, cadence kind, facts version, model-visible history key, item and
  request fingerprints, selected item index, inserted-or-verified status,
  Created-event commit timing, paired-write and partial-failure policy,
  replay pairing, resume suppression precedence, rollback/fork/compaction
  treatment, raw/typed projection boundaries, and evidence-local proof
  obligations. Final request-input selection and commit metadata production,
  durable live correctness, pending-intent storage, idle/history selection,
  classifier repair mechanics, extension lifecycle, and the replacement test
  matrix are routed to their owning successor docs by pointer or local
  reminder only.
  `goal-request-repair-and-artifact-classification.md` passed source and
  traceability coverage. It accounts for current Goal internal-context
  classification, legacy `<goal_context>` artifact classification, non-Goal
  internal context, mixed ordinary preservation, whole-message purity,
  wrong-role current Goal cleanup-only status, request-local repair, repair
  reports, helper/internal-context non-ownership, fake-shim replacement
  classifier boundaries, previous-response/model-context proof limits, and
  lost recorded item repair only through structured evidence. Final request
  input owns active cleanup effects and commit; cadence owns when Goal is due;
  durable owns facts and pending intent; projection/raw/history owns
  typed/materialized hiding, raw notifications, compaction, reconstruction,
  rollback, fork, and history-boundary effects; evidence owns metadata and
  fingerprint pairing; extension and test-prep are routed by pointer or local
  reminder only.
  `goal-projection-reconstruction-and-raw-history.md` passed source and
  traceability coverage. It accounts for typed/materialized hiding of pure
  current Goal internal-context items and pure legacy artifacts, raw
  notifications remaining raw for current/legacy/mixed `ResponseItem`s,
  contextual parsing and user-turn boundary behavior, compaction filtering,
  committed-carry-only preservation, rollout reconstruction cleanup,
  rollback/fork effects, structured evidence as metadata only, and legacy
  `<goal_context>` cleanup limits. Behavior, cadence, durable state, final
  request input, idle/history, recorded evidence, request repair/classifiers,
  extension lifecycle, fake-shim demolition sequencing, and the replacement
  test matrix are routed to their owning successor docs by pointer or local
  reminder only.
  `goal-extension-lifecycle-and-reachability.md` passed source and
  traceability coverage. It accounts for `ext/goal` lifecycle, extension and
  app-server mutation entry points, tool registration/execution, accounting,
  metrics, event emission, adapter/runtime conversion by default,
  metadata-only same-turn or idle wake requests, app-server/core mutation
  ordering, extension-origin `create_goal`, steering-role configuration
  compatibility, the blocker-triggered-only thin facade condition, reachable
  extension producer conversion/removal/unreachable outcomes, implementation
  terrain to audit, and extension-local proof obligations. Active authority,
  cadence event semantics, durable storage and exact-key state operations,
  final request-input shaping and commit, idle/history scheduling and
  suppression semantics, repair/classifier behavior, projection/raw/history
  support, evidence persistence, fake-shim demolition outside extension
  reachability, and the replacement test matrix are routed to their owning
  successor docs by pointer or local reminder only.
  `goal-test-prep-and-replacement-proof.md` passed source and traceability
  coverage. It accounts for prep sequence, local-only fake-context, core,
  app-server, TUI, and steering-role overlay deletion, upstream baseline
  restoration by file-specific diffs against `rust-v0.136.0`, upstream
  product baseline tests retained, the extension baseline caveat, replacement
  proof matrix by final payload, durable state, idle/history, evidence,
  cleanup/raw/projection, extension/app-server, and local behavior clusters,
  snapshot handling, final proof layers, and stale-symbol audit gates as
  review gates. Behavior, cadence, durable, final-input, idle/history,
  evidence, cleanup, and extension semantics are routed to owning docs by
  pointer or local reminder only.
  `goal-readiness-and-execution-handoff.md` passed source and traceability
  coverage. It accounts for Ready/Open/Blocker as design-input terms,
  consolidated-doc posture, current design-input readiness, implementation
  execution-plan handoff requirements, route index and work-area order as
  execution sequencing only, post-successor source-corpus treatment,
  operations/navigation/glossary container boundaries, executed handoff
  provenance limits, fake-shim demolition as separate transitional terrain,
  WA06 cleanup and acceptance only, final audit gates as review gates, and
  owner routing for any missing behavior discovered during handoff. Behavior,
  cadence, durable state, final-input, idle/history, evidence, cleanup,
  extension, and test semantics remain owned by their successor docs.
- Repeated-authority checks completed:
  `goal-authority-behavior.md` passed. Final request-input developer-role
  proof keeps behavior as the authority definition and final input as the
  mechanics owner. Active durable state alone, helper/provenance/classifier
  output, projection hiddenness, raw/tool output, evidence, fake-shim
  compatibility, user-role steering, runtime archaeology, and repair-as-cadence
  remain distinct negative rules rather than flattened generic prose.
  `goal-cadence-contract.md` passed. Cadence owns Initial,
  ObjectiveUpdated, BudgetLimit, automatic Continuation as a cadence event,
  supersedence, ordinary user-turn limits, cadence-required authority, and the
  repair-not-cadence boundary. Pending non-Continuation intent remains a
  durable/final contract with cadence-local reminders. Automatic Continuation
  stays idle-selected with history/final watermark ownership by pointer.
  Same-turn metadata remains metadata/wake behavior only, and ordinary user
  turns remain non-cadence while still being able to deliver already-pending
  non-Continuation intent.
  `goal-durable-state-and-pending-intent.md` passed. Pending
  Initial/ObjectiveUpdated/BudgetLimit intent keeps durable-state shape with
  final-input commit timing by pointer. Exact-key consumption is state-owned
  and distinct from mechanical supersedence cleanup. Active durable state
  alone remains facts, not authority or cadence. Automatic Continuation keeps
  the split between idle selection, history watermark comparison, final commit
  advancement, and state-owned storage of the committed suppression record.
  `goal-final-request-input.md` passed. Final request-input developer-role
  proof keeps finalization as the mechanics owner and behavior as the
  authority-definition owner. Pending non-Continuation intent keeps durable
  shape with final commit timing. Exact-key consumption remains durable-owned
  and only called after final-input commit. Retry/follow-up and committed carry
  are final-owned, while same-turn and synthetic request metadata lifecycle
  remain idle-owned by pointer. Evidence remains metadata-only, with final
  owning finalized-input identity and the evidence doc owning persistence and
  replay.
  `goal-idle-history-lifecycle.md` passed. Automatic Continuation keeps the
  explicit split between idle selection, history watermark comparison, final
  commit advancement, and durable/state-owned suppression storage. Pending
  non-Continuation intent remains durable/final-owned and outranks automatic
  Continuation, with idle-local delivery and stale-abort reminders. Resume
  stays hydration rather than cadence, same-turn recheck remains metadata/wake
  behavior only, and repair/compaction/reconstruction/evidence clauses remain
  local boundary reminders instead of becoming authority, storage, or commit
  mechanics.
  `goal-recorded-request-evidence.md` passed. Structured evidence keeps the
  full replay/audit metadata contract while final input owns finalized-input
  identity and durable/idle/history own live correctness and suppression
  defaults. Evidence remains metadata-only, ordinary rollout items and rollout
  trace are rejected as substitutes, no evidence is written before
  `ResponseEvent::Created`, paired append and partial-failure rules remain
  explicit when replay evidence matters, and rollback/fork/compaction rules
  preserve surviving structured evidence without parsing rendered text.
  `goal-request-repair-and-artifact-classification.md` passed. Request repair
  remains request-local and not cadence; active durable state alone is not
  repaired into steering; classifier, provenance, helper output, source tags,
  and repair reports remain non-authority; whole-message purity, mixed-content
  preservation, and wrong-role cleanup-only status are explicit; lost recorded
  item repair routes through evidence fingerprints instead of rendered text;
  and broad projection/raw/compaction/reconstruction behavior is routed to
  `goal-projection-reconstruction-and-raw-history.md` rather than absorbed
  into this doc.
  `goal-projection-reconstruction-and-raw-history.md` passed.
  Typed/materialized projection hiding remains distinct from raw notifications,
  with raw explicitly unchanged unless the general raw-response contract
  changes. Compaction and reconstruction keep the split between committed
  carry metadata, request-local repair, structured evidence/fingerprint
  pairing, and forbidden pre-finalizer concrete carry or rendered-text
  recovery. Rollback and fork operate on surviving history only; legacy
  artifacts remain cleanup-only; and projection/raw/reconstruction support
  surfaces do not become authority, cadence, durable facts, pending intent,
  evidence, final-input selection, or Continuation suppression.
  `goal-extension-lifecycle-and-reachability.md` passed. Extension lifecycle
  keeps producer mutation, accounting, events, configuration, metadata, and
  reachability as the canonical `T-EXT` surface while behavior/final own
  active developer-role authority and final payload proof. Same-turn requests
  remain metadata-only; app-server mutation remains product-owned and not
  forced through `codex-goal-extension`; user-role steering compatibility is
  rejected; adapter/runtime conversion is the default v136 route; a thin
  facade is blocker-triggered only; fake-shim demolition remains separate
  terrain outside extension reachability; and extension tests cannot preserve
  `GoalContext`, active `<goal_context>`, user-role active steering, or
  pre-finalizer concrete input as baseline authority.
  `goal-test-prep-and-replacement-proof.md` passed. Test prep keeps concrete
  deletion, baseline, matrix, snapshot, and final proof-layer ownership while
  behavior and seam docs retain behavior truth. It preserves local-only vs
  upstream-baseline distinctions, budget/usage as upstream facts, the
  extension baseline caveat, raw-remains-raw posture, final
  payload/structured-evidence proof wording, and audit gates as review gates;
  it does not define behavior, product redesign, implementation architecture,
  module names, or readiness handoff.
  `goal-readiness-and-execution-handoff.md` passed. Readiness remains a
  handoff gate rather than a behavior engine. Ready/Open/Blocker stay
  design-input status terms; implementation route indexes and slice order
  remain execution sequencing only; source docs and Pass 2 / Pass 2B artifacts
  become source corpus, provenance, or coverage aids after successors are
  accepted; operations, navigation, and glossary stay in their containers;
  fake-shim demolition stays separate transitional terrain; and WA06 remains
  cleanup/acceptance only with gaps routed back to owning successor docs.
- Open conflicts: none.
- Verification status: Passed final readiness source/traceability and
  repeated-authority checks after drafting
  `goal-readiness-and-execution-handoff.md`. Passed completion audit that all
  11 successor docs exist and the successor docs contain no temporary
  provenance or route-plan future-authority references. Passed
  `git diff --check -- local/goal_research` with existing LF-to-CRLF warnings
  only, and passed `rg -n "[ \t]$" local/goal_research` after completing the
  cursor.
- Next allowed action: Successor-doc drafting goal is complete. Future work
  may review, accept, or use the successor set for implementation execution
  planning.
