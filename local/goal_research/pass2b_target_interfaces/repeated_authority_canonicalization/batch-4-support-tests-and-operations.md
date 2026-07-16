# Batch 4: Support, Tests, And Operations

This is part of the Pass 2B.5 repeated-authority canonicalization workspace. It is not authority and does not supersede any source contract in `local/goal_research`.

Return to the [workspace README](README.md) for the canonicalization rules, template, batch order, and Pass 2C usage.

## Extension Reachability And Steering-Role Config Compatibility

Concept:

- Reachable extension active steering must be converted to shared final
  request-input shaping and cadence delivery, removed, or proven unreachable;
  user-role active steering cannot survive through config compatibility.

Canonical text:

- `T-EXT` owns extension lifecycle, configuration, reachability, mutation
  entry routing, and producer-facing typed cadence metadata.

Local reminders:

- `T-BEHAVIOR`: user-role active steering has no compatibility exception.
- `T-CADENCE`: extension-origin mutations can create cadence work.
- `T-DURABLE`: extension mutations persist facts/pending intent through state.
- `T-FINAL`: extension active steering routes through shared final shaping.
- `T-IDLE`: external mutation ordering and same-turn metadata delivery route
  through idle/lifecycle seams.
- `T-SHIM`: old extension fake-shim producers are demolition terrain.
- `T-TEST-PREP`: extension baseline tests must not keep fake-shim active
  steering alive.

Pointer-only:

- `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-READINESS`, `NAV-README`,
  `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep the high-level extension/config invariant only as a
  pointer.

Source sections carrying repeated authority:

- `goal-authority-ext-goal-ownership.md`: entire document.
- `goal-authority-fake-shim-removal-map.md`: Extension Goal Steering
  Producer, Work Area 5.
- `goal-authority-primary-cadence-contract.md`: ObjectiveUpdated,
  BudgetLimit, Ordering With Pending Work.
- `goal-authority-grounding-truth.md`: User-Role Goal Steering.
- `goal-test-deletion-map.md`: Revert Steering-Role Config Overlay, Upstream
  Baseline Tests That Remain Active, Replacement Test Profile.

Clauses that must not be lost:

- Extension-origin mutation can create durable facts and pending intent but
  cannot itself create active model input.
- Extension-owned `create_goal` remains valid when no Goal exists: success
  writes an active durable Goal plus pending Initial intent; duplicate create
  remains a product error, not a steering shortcut.
- Same-turn behavior is metadata-only cadence recheck/request metadata.
- Producer-facing adapter metadata must not leak private cadence/finalizer
  implementation types into `ext/goal`.
- Temporary deserialization cannot affect active steering role.
- A completed implementation cannot leave a compiled reachable extension path
  that emits `GoalContext`, `GoalContextRole`, `<goal_context>`, user-role
  active Goal internal context, or pre-finalizer concrete Goal input.
- Extension state/runtime tests alone do not establish active Goal authority;
  extension-origin payload coverage must inspect the final request input or
  pair extension state/runtime coverage with shared request-shaper coverage
  for equivalent pending intent.

Allowed compression:

- Keep full extension treatment in `T-EXT`; use pointers from behavior,
  cadence, final, idle, shim, and test prep.

Forbidden compression:

- Do not collapse to "remove ext/goal" or "extension owns Goal steering."

Pass 2C rewrite instruction:

- Rewrite extension from `goal-authority-ext-goal-ownership.md` after final
  and durable target contracts are stable enough to point to.

## Fake-Shim Removal

Concept:

- `GoalContext`, `GoalContextRole`, active `<goal_context>`, fake provenance,
  and active construction paths are deletion/conversion terrain, not
  compatibility architecture to preserve.

Canonical text:

- `T-SHIM` owns demolition terrain and work-area routing.
- `T-CLEANUP` owns strict replacement classifiers/projection for consumers.
- `T-FINAL` owns replacement final request-input shaping.

Local reminders:

- `T-BEHAVIOR`: explains why fake-shim authority is invalid.
- `T-EXT`: reachable extension producers must convert/remove/prove
  unreachable.
- `T-TEST-PREP`: delete false-compatibility tests and restore baseline.

Pointer-only:

- `T-CADENCE`, `T-DURABLE`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep "active Goal steering does not use GoalContext,
  GoalContextRole, or <goal_context>" as a short invariant.

Source sections carrying repeated authority:

- `goal-authority-fake-shim-removal-map.md`: entire document.
- `goal-authority-grounding-truth.md`: Legacy Goal Artifact Handling,
  Anti-Patterns.
- `goal-authority-primary-cadence-contract.md`: Legacy Goal Artifact,
  Fake-Shim Deletion Target.
- `goal-authority-repair-classifier-integration.md`: Classifier Outputs,
  Projection, Compaction, Reconstruction.
- `goal-test-deletion-map.md`: Delete Local-Only Fake Context Tests,
  Replacement Test Profile.

Clauses that must not be lost:

- Legacy artifact handling may remain, but only as cleanup/projection/
  compaction/reconstruction handling.
- Legacy artifacts must not recover active state, objective, cadence, pending
  intent, or user-role behavior.
- Current developer-role Goal input is not a legacy artifact to be casually
  filtered.
- Active Goal item construction must not call legacy artifact matching as part
  of the replacement path.
- Generic internal-context helpers may support rendering and strict
  classification, but they are not the main replacement architecture and do
  not prove authority.
- A completed implementation cannot leave any reachable active Goal producer
  on the fake shim, including extension producers that remain compiled and
  reachable.

Allowed compression:

- Keep file/callsite terrain in `T-SHIM`; point work areas to final, cleanup,
  extension, and tests for replacement behavior.

Forbidden compression:

- Do not turn the demolition map into a compatibility layer.

Pass 2C rewrite instruction:

- Keep `T-SHIM` concrete enough for later execution slices to find old roots,
  but do not restate replacement contracts in full.

## Replacement Test Profile And Upstream Baseline

Concept:

- Test prep removes local false-compatibility pressure while preserving
  upstream Goal product baseline; replacement tests prove behavior owned by
  target contracts.

Canonical text:

- `T-TEST-PREP` owns prep sequencing, upstream baseline restoration,
  replacement matrix, local overlay deletion, and snapshot handling.

Local reminders:

- Behavior/seam targets keep local proof obligations for the behavior they
  own.
- `T-EXT`/`T-SHIM` keep extension-shim baseline caveats.
- `OP-AGENTS` keeps a short operational pointer to the test-prep source.

Pointer-only:

- `T-READINESS`, `NAV-README`, and `GLOSSARY`.

Operational/test reminders:

- `OP-AGENTS` should not duplicate the matrix.
- `NAV-README` should route readers to test prep, not summarize the matrix.

Source sections carrying repeated authority:

- `goal-test-deletion-map.md`: entire document.
- `AGENTS.md`: Test Prep Posture and Non-Negotiables.
- Tests sections across authority docs.

Clauses that must not be lost:

- The prep target is not fewer tests.
- Delete local-only tests defending fake context, bad cadence, user-role
  active steering, local raw suppression, and local overlay behavior.
- Restore upstream baseline tests without blindly resetting unrelated work.
- Use file-specific diffs against `rust-v0.136.0`; do not blindly reset
  unrelated work in upstream test files.
- App-server protocol rollout-replay fake-context coverage is local-only
  deletion terrain, not permission to delete upstream product behavior.
- Budget and usage are upstream Goal facts.
- Replacement tests prove final payload or structured recorded request
  evidence where applicable, not helper output or rollout trace.
- Local configured objective-limit behavior may be re-added only from a
  specific replacement command/config contract.
- Snapshot handling must preserve the distinction between deleted local-only
  owner tests, upstream-owned snapshots restored to baseline, and intentional
  new or changed UI output.

Allowed compression:

- Keep global matrix in test prep; behavior/seam docs retain only local proof
  obligations.

Forbidden compression:

- Do not let `T-TEST-PREP` define behavior.
- Do not delete upstream Goal product tests because current local code fails
  after fake-shim removal.

Pass 2C rewrite instruction:

- Rewrite the test-prep target after behavior/seam targets are named, so each
  replacement cluster can point to the target that owns what it proves.

## Navigation, Glossary, Agents, And Readiness Surfaces

Concept:

- README, CONTEXT/GLOSSARY, AGENTS, and readiness docs route, define terms,
  instruct operations, or gate handoff. They must not become behavior
  authority engines.

Canonical text:

- `NAV-README` owns reader navigation.
- `GLOSSARY` owns vocabulary.
- `OP-AGENTS` owns operational instruction and authority order.
- `T-READINESS` owns readiness and handoff criteria.

Local reminders:

- Each may keep short warnings that source/target authority controls.
- `OP-AGENTS` may keep compact non-negotiables only after targets own the full
  clauses.

Pointer-only:

- All behavior and seam details point to target docs.

Operational/test reminders:

- `README.md` becomes a thin index after successor docs exist.
- `CONTEXT.md` remains glossary-only.
- `AGENTS.md` preserves conflict rules, reading posture, Direction Lock, and
  verification.
- `T-READINESS` keeps Ready/Open/Blocker as design-input status, not
  implementation completion.

Source sections carrying repeated authority:

- `AGENTS.md`: Authority Order, Navigation And Document Roles, Design
  Deliverables, Non-Negotiables, Test Prep Posture, Working Posture,
  Verification.
- `README.md`: Authority Spine, Core Through-Line, Supporting Seams, Current
  Terrain Anchors, Pass 2 Guardrails.
- `CONTEXT.md`: Glossary.
- `goal-authority-open-design-deliverables.md`: Corrected Posture,
  Readiness Rule.

Clauses that must not be lost:

- Navigation aids do not supersede authority.
- Version-specific plans must conform to `local/goal_research`.
- Existing Rust code is terrain, not mission.
- Agents must read applicable source docs directly and top to bottom; grep or
  navigation summaries cannot replace source-contract reading.
- Conflicts among controlling docs must be stopped and named, not silently
  resolved by weakening the grounding truth.
- Ready means design input, not concrete implementation.
- The consolidated-doc posture must survive: do not recreate separate
  cadence-module, finalizer/commit, adapter, store-interface, or
  state/behavior docs unless code inspection proves the consolidated docs too
  large to execute.
- Recorded request evidence remains a support seam for final request-input
  commit and replay/audit evidence; it is not a new authority mechanism.
- Current readiness means ready for an implementation execution plan that
  translates design inputs into ordered, file-specific slices without
  reopening core architecture absent direct conflict.

Allowed compression:

- After target docs own behavior, shrink operational/navigation prose to
  pointers plus short invariants.

Forbidden compression:

- Do not leave a non-negotiable only in `AGENTS.md` if the target contract no
  longer carries the full rule.
- Do not let glossary definitions carry edge-case behavior.

Pass 2C rewrite instruction:

- Rewrite navigation/operations after successor target docs exist and source
  slices are traced. Until then, keep current navigation aids as aids only.
