# Successor Doc Compression Handoffs

This is a temporary support file for running the successor-doc reader
compression sessions. It is not Goal authority, not source corpus, and not an
implementation plan.

Use one session block at a time. Do not ask one agent to complete multiple
blocks unless explicitly instructed. After all compression sessions,
navigation cutover, and stale-reference cleanup are complete, delete this file
with the remaining support artifacts.

## Repeatable Context

Repo: `C:\Users\cullendudas\Documents\GitHub\codex-pinned`

Area: `local/goal_research`

Current phase: Successor-doc reader compression

State:

- Pre-compression cleanup is complete.
- The 11 successor docs are drafted.
- `PASS2B_TARGET_INTERFACES.md` and `pass2b_target_interfaces/` have been
  removed.
- `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` carries the repeated-authority
  compression rules.
- `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` carries the ownership/routing map until
  compression and navigation cutover are complete.
- Do not use source-heading rows, Pass 2B packet files, repeated-authority batch
  files, drafting protocols, cursor files, or one-to-one target drafts as the
  writing method.

User authority:

- The user wants the successor docs hardened into a lean reader surface for
  agents.
- Compression should make the docs easier to read, not merely shorter.
- Current source/prep artifacts are optional check material only for a named
  disputed concept, suspected loss, or conflict.
- If compression would remove the only clear owner for a concept or weaken a
  non-negotiable, stop and name the conflict.

Common inputs for every session:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- The target successor docs named by the session

Optional inputs only if needed:

- `local/goal_research/PASS2_CONCEPT_LEDGER.md`
- `local/goal_research/PASS2_SECTION_TRACEABILITY.md`
- Old source docs only for a named disputed concept, suspected loss, or conflict

Common compression rules:

- Preserve `Navigation Header`, `Core Rule`, owned behavior/mechanics,
  non-ownership, negative rules, edge cases, caveats, exceptions, and
  implementation-shaped details that prevent wrong code.
- Remove or shrink broad `Read with` lists.
- Replace long `Cross-Doc Boundaries` sections with short `Primary Pointers`
  only where non-obvious owner routing is useful.
- Keep `Local Proof Obligations` only when they are genuinely local to the
  target doc.
- Delete or collapse `Source Inputs And Coverage` so final reader docs do not
  carry old source/prep/protocol inventories.
- Use pointer-only references when another successor doc owns the concept and
  the local seam cannot directly violate it.

Common stop conditions:

- Compression would remove the only clear owner for a concept.
- Compression would weaken final developer-role request-input authority.
- Compression would make state, evidence, projection, helper output, raw output,
  tool output, tests, or UI hiddenness prove authority.
- Compression would make ordinary user turns cadence events.
- Compression would collapse exact-key consumption into broad cleanup.
- Compression would lose an edge case, caveat, exception, failure rule, rollback
  rule, or negative rule.
- Compression would require redesigning topology rather than compressing reader
  wording.

Common verification:

```powershell
git diff --check -- local\goal_research
rg -n "[ \t]$" local\goal_research
```

Each session should also run a focused stale-section grep against its target
files:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" <target files>
```

Deliverable for every session:

- Report files changed.
- Report which sections were removed, renamed, or collapsed.
- Report any concepts intentionally preserved despite repetition.
- Confirm no source/prep/protocol artifact became required reader input.
- Confirm verification results.
- Name the next compression session.
- Do not claim all compression is complete unless this is the final compression
  session and every successor doc has been checked.

## Session 1A: Core Authority

Task alignment:

- Request: Compress the core authority successor docs in place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: Behavior and cadence docs are likely to repeat final-input, durable,
  idle/history, cleanup, extension, and test-prep mechanics.
- Code-shape temptation: Keep broad cross-doc restatements because behavior and
  cadence are foundational.
- Locked direction: Keep behavior/cadence authority and negative rules crisp;
  replace broad mechanics restatements with short pointers or local reminders.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target files:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target files above

Focus:

- Preserve final developer-role authority at the behavior level.
- Preserve ordinary-user-turn, repair-not-cadence, active-state-non-authority,
  and cadence-required authority boundaries.
- Remove broad restatements of durable, final-input, idle/history, evidence,
  cleanup, extension, and test-prep mechanics.
- Keep only local proof obligations that prove behavior/cadence rules.

Do not:

- Re-describe final request-input shaping mechanics in full.
- Re-describe durable pending-intent storage in full.
- Move broad proof matrix material into behavior/cadence.
- Start Session 1B.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-authority-behavior.md local\goal_research\goal-cadence-contract.md
```

Next session: Session 1B Core Mechanics.

## Session 1B: Core Mechanics

Task alignment:

- Request: Compress the durable-state and final-request-input successor docs in
  place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: These docs own many implementation-shaped details and may repeat
  behavior/cadence/idle/history/evidence boundaries.
- Code-shape temptation: Delete too much because the docs are long, or keep all
  details because they are implementation-shaped.
- Locked direction: Preserve owned mechanics exactly; remove repeated
  behavior/cadence explanations where a short local warning or pointer is
  enough.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target files:

- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-final-request-input.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target files above

Focus:

- Preserve durable facts, durable facts version, pending non-Continuation
  intent, atomic mutation, supersedence cleanup, exact-key consumption, and
  state-owned Continuation suppression storage.
- Preserve per-attempt finalization, eligibility gates, selection inputs,
  request-local cleanup/repair, selected-item rendering, commit metadata,
  Created-event commit point, retry/follow-up, stale metadata, committed carry,
  and evidence metadata boundaries.
- Remove repeated behavior/cadence/idle/history explanations when the local doc
  only needs a boundary warning.
- Keep implementation-shaped distinctions among state, selection, commit,
  evidence metadata, and current-turn carry.

Do not:

- Collapse exact-key consumption into generic cleanup.
- Make durable state itself authority or cadence.
- Make final-input commit happen at render/construction/reservation time.
- Start Session 1C.1.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-durable-state-and-pending-intent.md local\goal_research\goal-final-request-input.md
```

Next session: Session 1C.1 Idle And History.

## Session 1C.1: Idle And History

Task alignment:

- Request: Compress the idle/history successor doc in place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: This is one of the largest successor docs and may restate durable,
  final-input, cadence, evidence, and cleanup mechanics.
- Code-shape temptation: Treat all lifecycle references as locally owned
  mechanics.
- Locked direction: Preserve idle ordering and history/suppression semantics;
  replace non-local durable/final/evidence mechanics with short pointers or
  seam-specific reminders.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target file:

- `local/goal_research/goal-idle-history-lifecycle.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target file above

Focus:

- Preserve legal idle callers, required stage order, pending non-Goal work
  precedence, pending durable intent delivery from idle, automatic Continuation
  selection, lock/reservation/stale synthetic behavior, model-visible history
  key, eligible progress projection, suppression comparison/reconstruction,
  resume/restart, same-turn metadata routing, and compaction/rollback/fork
  effects that are local to history.
- Remove duplicated final-input, durable-state, evidence, and cleanup mechanics
  except where needed as local boundaries.
- Keep the split between idle selection, history watermark, final commit
  advancement, and durable suppression storage clear.

Do not:

- Turn pending non-Continuation delivery into automatic Continuation.
- Make ordinary user turns cadence events.
- Make the Continuation item itself the progress that permits another
  Continuation.
- Start Session 1C.2.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-idle-history-lifecycle.md
```

Next session: Session 1C.2 Recorded Evidence.

## Session 1C.2: Recorded Evidence

Task alignment:

- Request: Compress the recorded-request-evidence successor doc in place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: Evidence owns replay/audit metadata and can easily drift into
  authority, cadence, durable-state, or final-input proof language.
- Code-shape temptation: Keep long cross-doc safeguards because evidence is
  high-risk.
- Locked direction: Preserve the evidence carrier and metadata contract while
  shortening non-local authority/cadence/durable/final boundaries.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target file:

- `local/goal_research/goal-recorded-request-evidence.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target file above

Focus:

- Preserve correctness split, carrier, evidence shape, fingerprints, commit
  timing, commit ordering/failure policy, replay/pairing, resume/suppression
  interaction, rollback/fork/compaction, and raw/typed projection boundaries.
- Preserve that evidence is metadata only and does not materialize active model
  input.
- Remove duplicated final-input identity, durable live-correctness, idle/history
  selection, cleanup/projection, and test-prep rules except as local boundary
  reminders.

Do not:

- Make evidence authority, cadence selection, pending-intent storage, final
  input inspection, or active Goal recovery.
- Treat ordinary rollout items or rollout trace as equivalent structured
  evidence.
- Start Session 1D.1.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-recorded-request-evidence.md
```

Next session: Session 1D.1 Cleanup.

## Session 1D.1: Cleanup

Task alignment:

- Request: Compress the request-repair/classification and
  projection/reconstruction/raw-history successor docs in place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: Cleanup surfaces repeat authority, cadence, durable, final-input,
  evidence, extension, and test-prep boundaries because support mechanisms are
  easy to mistake for authority.
- Code-shape temptation: Keep every "support is not authority" restatement
  everywhere.
- Locked direction: Preserve cleanup mechanics and local non-authority warnings;
  remove non-local behavior/cadence/final-input restatements when a pointer is
  enough.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target files:

- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target files above

Focus:

- Preserve classifier outputs, whole-message purity, helper/internal-context
  boundaries, request-local repair, repair decision table, repair report,
  consumer routing, and fake-shim boundary.
- Preserve projection/hiding, raw response notifications, contextual parsing
  and history boundaries, compaction, rollout reconstruction, rollback/fork,
  legacy artifact handling, and fake-shim consumer replacement.
- Keep local warnings that classifier/helper/projection/raw/reconstruction
  output is not authority where the local seam can violate that rule.
- Remove repeated cadence/durable/final/evidence/test details that are not
  local cleanup behavior.

Do not:

- Make request repair cadence.
- Let classifier/provenance/helper output prove authority.
- Suppress raw response item notifications unless the general raw-response
  contract changes.
- Start Session 1D.2.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-request-repair-and-artifact-classification.md local\goal_research\goal-projection-reconstruction-and-raw-history.md
```

Next session: Session 1D.2 Extension.

## Session 1D.2: Extension

Task alignment:

- Request: Compress the extension lifecycle/reachability successor doc in
  place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: Extension docs can repeat behavior/cadence/final-input/durable
  rules because extension mutation can create cadence work and old extension
  steering terrain is high-risk.
- Code-shape temptation: Preserve old extension/fake-shim detail as permanent
  authority or over-delete reachability constraints.
- Locked direction: Preserve extension-owned lifecycle and reachability
  decisions while pointer-routing active authority, final shaping, durable
  storage, and idle scheduling.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target file:

- `local/goal_research/goal-extension-lifecycle-and-reachability.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target file above

Focus:

- Preserve selected route, extension-owned lifecycle, mutation/delivery
  pipeline, app-server/core mutation ordering, configuration compatibility,
  reachability rule, and implementation terrain to audit.
- Preserve no user-role compatibility and no reachable fake-shim steering.
- Remove repeated final-input, cadence, durable, idle/history, cleanup, and
  test-prep mechanics unless the extension seam can directly violate them.

Do not:

- Let `ext/goal` own active model-input construction, model role selection,
  final-input commit, pending-intent consumption, or Continuation watermark
  advancement.
- Reopen the extension route unless a direct conflict makes compression
  impossible.
- Start Session 1E.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-extension-lifecycle-and-reachability.md
```

Next session: Session 1E Proof And Handoff.

## Session 1E: Proof And Handoff

Task alignment:

- Request: Compress the test-prep/proof and readiness/handoff successor docs in
  place.
- Authority: `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` controls compression rules;
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` controls ownership/routing.
- Terrain: Test prep and readiness collect review/proof obligations and can
  become the easiest-to-read substitute for behavior/seam authority.
- Code-shape temptation: Move broad proof matrix material here without
  preserving that behavior remains owned by the seam docs.
- Locked direction: Keep proof/handoff material operational and compact while
  ensuring behavior and seam docs remain the authority owners.
- Exclusions: Do not edit other successor docs, old source docs, navigation
  docs, support artifacts, or Rust code.

Target files:

- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_research/goal-readiness-and-execution-handoff.md`

Read first:

- `local/goal_research/SUCCESSOR_DOC_COMPRESSION_GUIDE.md`
- `local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- target files above

Focus:

- Preserve prep sequence, local-only overlay deletion, upstream baseline
  restoration, replacement proof matrix, final acceptance proof layers,
  snapshot handling, stale-symbol audits, Ready/Open/Blocker meanings, current
  design-input status, execution-plan requirements, handoff requirements,
  source-corpus posture, demolition terrain boundary, and final cleanup/
  acceptance.
- Remove broad cross-doc restatements of behavior and seam mechanics when
  proof/readiness only needs pointers.
- Keep proof matrix material in test prep and readiness only when it helps
  execution, review, or handoff.

Do not:

- Let tests define behavior.
- Let readiness become behavior authority.
- Start navigation cutover unless explicitly instructed after this session.

Focused verification:

```powershell
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage|Pass 2 / Pass 2B|PASS2B_TARGET_INTERFACES|pass2b_target_interfaces" local\goal_research\goal-test-prep-and-replacement-proof.md local\goal_research\goal-readiness-and-execution-handoff.md
```

Next step after Session 1E:

- Run a successor-only consistency pass before navigation cutover.
- Do not delete `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`,
  `SUCCESSOR_DOC_COMPRESSION_GUIDE.md`, `PASS2_CONCEPT_LEDGER.md`, or
  `PASS2_SECTION_TRACEABILITY.md` until compression and navigation cutover are
  complete.
