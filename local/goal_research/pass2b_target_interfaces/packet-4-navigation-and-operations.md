# Packet 4: Navigation And Operations

This is a Pass 2B prep artifact. It is not future implementation authority and
does not close any Pass 2A row.

Shared Pass 2B rules live in [README.md](README.md).

Status: complete and bottom-up reviewed.

Targets:

- `NAV-README`
- `GLOSSARY`
- `OP-AGENTS`

Goal:

Define what remains as navigation, vocabulary, and operational instruction
after successor target interfaces exist.

Packet focus:

- `NAV-README` remains a reader map and terrain/navigation aid, not authority
- `GLOSSARY` remains vocabulary-only and must not collect implementation
  details or test obligations
- `OP-AGENTS` keeps authority order, conflict rules, non-negotiable pointers,
  working posture, and verification expectations
- operational short lists may become pointers only after target contracts own
  the full behavior


## Packet 4 Interface Entries

The Navigation And Operations packet found no wrong/stale Pass 2A mappings
that need prep-artifact repair before these entries. Rows listed below still
need source-bounded Pass 2C rewrite before they become successor authority.

### NAV-README: Reader Map And Target Navigation Index

Purpose:

- Define the reader-facing navigation surface for Goal authority docs without
  making the reader map a second authority layer.
- Keep document roles, authority spine routing, supporting seam routing,
  terrain anchors, and Pass 2 guardrails easy to scan before and after
  successor target docs exist.

Owns:

- The reader start path for this directory: local instructions, glossary, and
  the behavioral authority spine.
- Reader-level authority spine navigation and the warning that repeated spine
  clauses are authority reinforcement until canonicalized.
- The high-level through-line that durable cadence state and per-attempt final
  request-input shaping/commit carry the replacement design, while support
  seams remain support seams.
- Question-to-document routing for source docs before cutover and target
  interface routing after successor docs exist.
- Current terrain anchors as navigation to code terrain, with explicit
  framing that terrain is not mission.
- Current document-role tables before cutover and target-interface maps after
  successor docs exist.
- Pass 2 guardrails that direct agents to traceability, concept coverage, and
  fidelity review before rehome, merge, split, or rewrite work.
- Reader-aid metadata from source `Navigation Header` sections, only as
  navigation to the owning authority or target interface.

Does Not Own:

- Behavior contracts, cadence semantics, durable state semantics, final
  request-input shaping, idle lifecycle, history-key semantics, evidence
  persistence/replay, cleanup/repair, extension lifecycle, shim demolition,
  replacement test matrix, readiness gates, glossary definitions, or
  operational conflict rules.
- Authority order or local execution instructions. Those belong to
  `OP-AGENTS`.
- Term definitions except for linking readers to `GLOSSARY`.
- Any code terrain as desired architecture.
- Cutover, rename, rehome, or source-slice closure.

Shared / Local Non-Negotiables:

- README remains navigation only until cutover. If a navigation summary differs
  from a source contract, the source contract wins and the navigation should be
  fixed.
- Navigation summaries must not weaken non-negotiables, erase edge cases, or
  make support helpers look like authority mechanisms.
- Current terrain anchors must stay framed as terrain, not implementation
  mission or desired architecture.
- Reader maps may say where a concept is owned, but they must not restate the
  full contract in a way that can drift from the target docs.
- After successor docs exist, README should become a thin index to the target
  authority set, glossary, operational rules, and any retained prep artifacts.
- Pass 2B target-interface files are prep artifacts and should be clearly
  separated from successor authority docs.

Pointer-Only Dependencies:

- `OP-AGENTS` owns authority order, conflict handling, top-to-bottom reading
  requirements, Direction Lock posture, working posture, and verification
  posture.
- `GLOSSARY` owns vocabulary definitions that README links to.
- `T-BEHAVIOR` owns the behavioral authority spine.
- `T-CADENCE`, `T-DURABLE`, and `T-FINAL` own the core replacement through-line
  summarized by README.
- `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`,
  `T-TEST-PREP`, and `T-READINESS` own the supporting seam, execution-prep,
  and readiness details that README routes to.
- `PASS2_SECTION_TRACEABILITY.md`, `PASS2_CONCEPT_LEDGER.md`, and the Pass 2B
  packet files remain prep inventories until successor docs are written.

Canonical Source Inputs:

- `README.md`: entire document, especially title and intro, Authority Spine,
  Core Through-Line, Supporting Seams, Current Terrain Anchors, Document Roles,
  and Pass 2 Guardrails.

Supporting Source Inputs:

- `AGENTS.md`: Navigation And Document Roles, Working Posture, Authority
  Order, and Design Deliverables, only as navigation constraints.
- `CONTEXT.md`: title and intro, only for the glossary link and
  non-authority framing.
- Source authority document `Navigation Header` sections, only as reader-aid
  metadata to route readers to the owning target interfaces.
- `goal-authority-open-design-deliverables.md`: Navigation Header and
  Readiness Rule, only for routing readers toward readiness/handoff criteria.
- `PASS2_SECTION_TRACEABILITY.md`: Operational And Navigation Docs and rows
  mapped to `NAV-README`.
- `PASS2_CONCEPT_LEDGER.md`: repeated-authority handling and concept rows that
  mention `NAV-README`.

Concept Ledger Inputs:

- Owns: no behavior concept rows. `NAV-README` is a navigation surface driven
  mainly by section traceability.
- Shared: Design readiness vs execution plan, only as a reader route from
  README guardrails to `T-READINESS` and `OP-AGENTS`.
- Pointer-only: every behavior concept summarized by README, including Goal
  authority, cadence, durable state, final model request input, recorded
  request evidence, cleanup, extension reachability, fake-shim removal, and
  replacement test profile.

Fidelity Tripwires / Review Debt:

- Do not let README become the easiest-to-read replacement for source
  authority before cutover.
- Do not turn the Core Through-Line into a behavior contract that omits the
  detailed target interfaces.
- Preserve the terrain-not-mission framing for all code anchors.
- Preserve the distinction between source document roles before cutover and
  target document interfaces after cutover.
- Preserve Pass 2 guardrails around traceability, lost edge cases, stale code
  terrain, repair, retry, resume, compaction, raw notifications, and test prep.
- Do not let navigation headers close source rows or replace source-bounded
  Pass 2C rewrites.

Pass 2C Rewrite Notes:

- Rewrite README after successor target docs exist, not before.
- Replace the current source-doc role table with a target-doc interface map
  only after target docs are written and source slices are traced.
- Keep README short enough to be a reader map; use explicit links and
  one-sentence routing notes instead of duplicating target contracts.
- Keep Pass 2 guardrails visible until cutover is complete.

True Open Questions:

- None found in Packet 4. Exact README cutover wording depends on the final
  successor doc set produced by Pass 2C.

### GLOSSARY: Goal Domain Vocabulary

Purpose:

- Define shared Goal authority vocabulary so agents can read source contracts
  and successor docs without reconstructing terms from repeated prose.
- Keep vocabulary separate from implementation details, edge-case authority,
  test obligations, and target-interface ownership.

Owns:

- Glossary-only definitions for Goal authority domain terms, including Goal,
  Goal authority, active Goal steering, durable Goal facts/state, durable
  facts version, cadence, cadence event, steering kind, automatic
  Continuation, supersedence, pending cadence intent, exact-key consumption,
  final model request input, final request-input shaping, selected Goal item,
  commit, commit metadata, item fingerprint, request repair, legacy artifact,
  generic internal context, pure/mixed items, classifier, typed/materialized
  projection, raw response item notification, current-turn carry,
  model-visible history key, eligible progress projection, Continuation
  watermark, idle lifecycle hook, hydration, structured cadence request,
  structured recorded request evidence, extension reachability, upstream
  baseline, local overlay, replacement test profile, and runtime archaeology.
- Target-home/key vocabulary for Pass 2B prep artifacts when those labels help
  readers understand the interface map, while preserving that they are not
  final filenames.
- Term updates only when source authority or settled target-interface work
  changes the domain language.

Does Not Own:

- Behavior contracts, cadence event rules, pending-intent consumption,
  final-input shaping, commit side effects, evidence persistence/replay,
  classifier output contracts, purity edge cases, raw-notification behavior,
  replacement test obligations, readiness gates, or operational instructions.
- Code ownership, implementation plans, module/function names, migrations, or
  slice order.
- Source authority over target docs through concise definitions.

Shared / Local Non-Negotiables:

- Glossary definitions may identify what a term is not, but they must not
  carry the full implementation or behavior contract.
- A term must not acquire behavior by implication. If behavior matters, point
  to the target that owns it.
- Implementation specifics, exception clauses, edge cases, and test
  obligations belong in target contracts or test-prep docs, not in the
  glossary.
- Glossary terms should stay aligned with source authority and successor docs;
  stale terms should be updated rather than interpreted as authority.
- Classifier and projection terms are vocabulary only; classifier contracts
  belong to `T-CLEANUP`.

Pointer-Only Dependencies:

- `T-BEHAVIOR` owns behavior behind Goal authority, active steering, runtime
  archaeology, helper/provenance non-authority, and user-role rejection terms.
- `T-CADENCE` owns cadence, cadence event, steering kind, supersedence,
  cadence-required authority, ordinary-user-turn, and repair-not-cadence
  semantics.
- `T-DURABLE` owns durable facts, durable facts version, pending cadence
  intent, and exact-key consumption semantics.
- `T-FINAL` owns final model request input, final request-input shaping,
  selected item, commit, commit metadata, item fingerprint, retry/follow-up,
  and current-turn carry semantics.
- `T-IDLE` owns idle lifecycle hook, Goal-owned synthetic turn, turn
  reservation, pending non-Goal work, and hydration-at-idle semantics.
- `T-HISTORY` owns model-visible history key, eligible progress projection,
  and Continuation watermark semantics.
- `T-EVIDENCE` owns structured recorded request evidence semantics.
- `T-CLEANUP` owns request repair, repair item, legacy artifact handling,
  generic internal context, pure/mixed item, classifier, projection, raw
  notification, compaction, and reconstruction semantics.
- `T-EXT`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS`, `NAV-README`, and
  `OP-AGENTS` own their target-specific meanings outside pure vocabulary.

Canonical Source Inputs:

- `CONTEXT.md`: entire document.
- `goal-authority-grounding-truth.md`: Terminology.

Supporting Source Inputs:

- `AGENTS.md`: Navigation And Document Roles, only for glossary-only framing.
- `README.md`: title and intro, only for navigation relationship to
  `CONTEXT.md`.
- Source sections named by glossary terms when a definition must be checked
  during Pass 2C.
- `goal-authority-recorded-request-evidence.md`: title, Navigation Header,
  Core Rule, and Carrier Choice, only for the vocabulary boundary that
  recorded request evidence is structured committed metadata and not
  authority.
- `PASS2_SECTION_TRACEABILITY.md`: `CONTEXT.md` rows, Grounding Truth
  Terminology row, and Classifier Outputs row where `GLOSSARY` is pointer-only
  for term names.
- `PASS2_CONCEPT_LEDGER.md`: repeated-authority handling for glossary terms.

Concept Ledger Inputs:

- Owns: glossary terms that define vocabulary rather than seam behavior.
- Shared: none as behavior ownership.
- Pointer-only: every glossary or high-risk vocabulary concept named by
  `CONTEXT.md` or source authority; especially Final model request input,
  Final request-input shaping, Recorded request evidence, Request repair,
  Classifier outputs, Purity rules, Raw response notifications,
  Model-visible history key, Continuation watermark, and Replacement test
  profile.

Fidelity Tripwires / Review Debt:

- Do not move implementation-specific clauses or test obligations into
  glossary definitions because the glossary is easy to find.
- Do not shorten terms so much that "final model request input",
  "structured recorded request evidence", "repair", or "classifier" can be
  mistaken for helper output, rollout trace, cadence selection, or authority.
- Preserve negative definitions only as vocabulary guardrails, with pointers
  to owning target docs for the full rule.
- Preserve resolved terminology such as metadata-only same-turn cadence
  recheck/request metadata without turning the glossary into an implementation
  adapter spec.
- Preserve that target-home labels are provisional interface keys in prep
  artifacts, not final filenames or authority by themselves.

Pass 2C Rewrite Notes:

- Rewrite glossary definitions after the successor target docs stabilize, so
  each definition can point to the owning target without duplicating it.
- Keep definitions concise but not lossy: include enough negative framing to
  prevent common misreadings, then point to the target that owns the details.
- Add new terms only when a target doc needs shared language, not as a place to
  store unresolved design.

True Open Questions:

- None found in Packet 4. Final term ordering and target-key vocabulary depend
  on the successor document names chosen during cutover.

### OP-AGENTS: Operational Instructions And Authority Order

Purpose:

- Define the operational instruction surface for agents working in
  `local/goal_research`.
- Keep the direct-implementation authority order, Pass 2C doc-worker
  reconciliation posture, conflict handling, required reading posture,
  Direction Lock, working posture, design-deliverable gate, test-prep pointer,
  and verification expectations enforceable without making `AGENTS.md` a
  replacement for target contracts.

Owns:

- The distinction between direct implementation posture and Pass 2C
  doc-worker posture.
- The statement that current Goal authority docs are design contracts, not
  brainstorming notes, for direct implementation and version planning until
  successor docs are cut over.
- The rule that version-specific implementation plans outside this directory
  must conform to `local/goal_research` authority for direct implementation,
  unless an explicit later authority update says otherwise.
- The Pass 2C rule that current source docs are the source corpus and relevant
  `local/goal_136_plan/work-areas` decisions are required reconciliation
  inputs that win on conflict or uncertainty when they preserve the underlying
  concept and latest researched v136 design.
- Required authority order and conflict behavior before cutover, including the
  instruction to stop and name conflicts.
- Navigation roles for `README.md` and `CONTEXT.md` as aids that do not
  supersede source contracts.
- Top-to-bottom reading posture for applicable Goal authority docs before
  editing docs or implementing Goal authority work.
- The design-deliverable gate before implementation planning.
- Operational non-negotiable pointers that remind agents which clauses must
  remain intact while the full behavior lives in target contracts.
- Test prep posture pointing to `goal-test-deletion-map.md`.
- Working posture: existing Rust code is terrain, not mission, and Direction
  Lock is required before execution.
- Docs-only and Rust verification expectations.
- After cutover, the operational pointer to the successor authority set and
  the rule that navigation/vocabulary docs are not peer authority.

Does Not Own:

- The full behavior of Goal authority, cadence, durable state, final request
  input, idle lifecycle, model-visible history key, recorded request evidence,
  cleanup/repair, extension lifecycle, fake-shim demolition, test matrix, or
  readiness criteria.
- Glossary term definitions, reader maps, source-section traceability, concept
  ledgers, Pass 2B interfaces, or Pass 2C rewrite content.
- Implementation plans, Rust code shape, exact module/function names, or
  execution slice order.
- Product redesign or changes to upstream Goal baseline behavior.

Shared / Local Non-Negotiables:

- `AGENTS.md` carries operational force. Its short lists may point to
  authority, but they must not become the only place behavior is specified.
- For direct implementation, source authority docs control until cutover.
  After cutover, AGENTS should point to the successor authority set rather than
  preserving obsolete source order.
- For Pass 2C doc-worker tasks, source docs are corpus and work-area decisions
  are reconciliation inputs; faithful concept retention is the boundary, not
  preservation of duplicate old prose.
- Conflicts among controlling docs must be stopped and named; agents must not
  silently choose an implementation shape that weakens the grounding truth.
- Existing Rust code remains terrain. Local implementation plans remain terrain
  for direct implementation unless source authority incorporates them, but
  `local/goal_136_plan/work-areas` is a required Pass 2C reconciliation source.
- Operational reminders for non-negotiables should stay short and pointer-like
  after target contracts own the full behavior.
- Docs-only work should keep cheap whitespace verification visible; Rust work
  follows root validation guidance.

Pointer-Only Dependencies:

- `NAV-README` owns the reader map and target navigation index.
- `GLOSSARY` owns vocabulary.
- `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`,
  `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP`, and
  `T-READINESS` own the detailed contracts and prep responsibilities that
  operational short lists point to.
- `PASS2_SECTION_TRACEABILITY.md`, `PASS2_CONCEPT_LEDGER.md`, and Pass 2B
  packet files are prep artifacts and do not supersede operational source
  authority.

Canonical Source Inputs:

- `AGENTS.md`: entire document, especially Authority Order, Navigation And
  Document Roles, Design Deliverables, Non-Negotiables, Test Prep Posture,
  Working Posture, and Verification.

Supporting Source Inputs:

- `README.md`: title and intro, Authority Spine, Pass 2 Guardrails, only for
  navigation-aid boundaries and cutover routing.
- `CONTEXT.md`: title and intro, only for vocabulary-aid boundaries.
- `goal-authority-open-design-deliverables.md`: Readiness Rule, only for the
  implementation-plan gate.
- `goal-test-deletion-map.md`: Prep Rule and Upstream Baseline Tests That
  Remain Active, only for test-prep pointer and upstream baseline reminders.
- `PASS2_SECTION_TRACEABILITY.md`: Operational And Navigation Docs and
  Readiness Rule row.
- `PASS2_CONCEPT_LEDGER.md`: Upstream Goal product baseline and Design
  readiness vs execution plan rows.

Concept Ledger Inputs:

- Owns: no behavior concept rows. `OP-AGENTS` is an operational surface.
- Shared: Design readiness vs execution plan, only as the operational gate
  that agents must read before implementation planning; Upstream Goal product
  baseline, only as an operational non-negotiable pointer.
- Pointer-only: every non-negotiable behavior concept listed by `AGENTS.md`,
  including Goal authority, pending cadence intent, automatic Continuation,
  repair, resume hydration, raw response notifications, extension
  reachability, fake-shim removal, and replacement test profile.

Fidelity Tripwires / Review Debt:

- Do not let AGENTS become a compact substitute for the target contracts.
- Preserve the conflict rule and direct-implementation authority-order force
  until successor authority docs replace the current source order.
- Preserve the Pass 2C doc-worker exception: current source docs are source
  corpus, and `local/goal_136_plan/work-areas` can clarify or supersede older
  wording during rewrite when the concept is retained.
- Preserve the distinction between navigation aids and authority docs.
- Preserve the instruction that version-specific plans must conform to
  `local/goal_research` for direct implementation work, while Pass 2C performs
  source/work-area reconciliation before successor docs are cut over.
- Preserve Direction Lock and terrain-not-mission posture for implementation
  work.
- Preserve upstream Goal product baseline reminders as operational pointers,
  not as test-matrix ownership.
- After cutover, remove or shrink duplicated behavior prose only after the
  target contracts own the full clauses.

Pass 2C Rewrite Notes:

- Rewrite AGENTS after the successor authority set is known.
- Keep AGENTS operational: authority order, conflict handling, reading
  posture, navigation/vocabulary relationship, implementation-plan gate,
  working posture, and verification.
- Replace long non-negotiable duplicates with short invariant reminders and
  links only after target contracts carry the full behavior.
- Keep implementation-vs-doc-worker precedence explicit because later
  implementation plans will continue to live outside `local/goal_research`,
  while Pass 2C must integrate settled work-area decisions into successor docs.

True Open Questions:

- None found in Packet 4. Exact successor authority order depends on the
  target document set produced by Pass 2C and cutover.
