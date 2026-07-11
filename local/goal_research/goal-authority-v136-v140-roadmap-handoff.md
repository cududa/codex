# Goal Authority Roadmap Handoff, v136-v140

## Suggested Skills

- `finding-lineage-review`: use when carrying the v135 Goal authority finding into v136, v137, v138, v139, or v140 Review Dedeluger findings.
- `finding-research`: use for focused Review Dedeluger updates, artifact treatments, notes, discussions, or section rewrites without code implementation.
- `findings-guided-implementation`: use only when the user explicitly starts implementation for one version or finding.
- `task-alignment`: use before implementation or broad code reading, because this work is vulnerable to drifting toward the visible upstream shape instead of the intended authority-preserving integration.
- `handoff`: use again before compaction or when handing this roadmap to another agent.

## Purpose

This handoff captures the broader Goal steering authority roadmap after the v135 planning work and the v136-v140 upstream research pass. It is intended to help a future agent preserve the hard-won conceptual distinction:

```text
accept upstream terrain
  does not mean
accept upstream Goal authority semantics
```

The user is reviewing stacked upstream Codex versions and wants to integrate upstream architecture where it is useful, while preserving the local Goal behavior: active Goal steering is runtime-owned hidden guidance that reaches the model as developer-role input by default. The objective text inside the steering frame remains escaped untrusted user data. Hidden/provenance wrappers classify the content; they do not grant authority.

The most important future-agent failure mode is to see upstream `InternalModelContextFragment(source="goal")` and conclude the problem is solved. It is not solved if that fragment still serializes as `role: "user"`.

## Current Context

The v135 finding and remediation plan have already been updated heavily. The MCP representation now contains the latest v135 finding sections and artifact treatments. Local implementation is being handled by a separate agent; ignore that work unless the user explicitly asks for review or coordination.

Important local artifacts in the repo, if still present:

- `v135-plan.md`
- `v135-goal-finding-sections-draft.md`
- `v135-goal-steering-plan-lock.md`

Important earlier temp handoff:

- `%TEMP%/v135-goal-authority-handoff.md`

This document is not a substitute for the v135 implementation plan. It is a roadmap and conceptual handoff for v136-v140 and later integration discussions.

## Non-Negotiable Invariant

Active Goal steering must be constructed from live Goal state and reach final model input as developer-role by default:

```text
Goal runtime state
  -> Goal-owned steering frame
  -> escaped objective + source-authority prompt
  -> hidden/provenance wrapper
  -> ResponseInputItem/ResponseItem::Message { role: "developer", ... }
```

For v135, the wrapper is `<goal_context>`.

For v136+, the wrapper likely becomes:

```text
<codex_internal_context source="goal">...</codex_internal_context>
```

That wrapper is valuable because it gives provenance and hidden-context classification. It is not the authority boundary. The outer typed model-input role is the authority boundary.

The target v136+ shape is therefore:

```text
ResponseItem::Message {
  role: "developer",
  content: "<codex_internal_context source=\"goal\">...</codex_internal_context>"
}
```

or the version-equivalent `ResponseInputItem` form.

## What To Accept Versus Adapt

Accept upstream structure where it helps:

- `InternalModelContextFragment`
- `InternalContextSource`
- `<codex_internal_context source="goal">`
- `codex-context-fragments`
- role-bearing contextual fragment/contributor infrastructure
- `TurnInputContributor`, if it can carry role-bearing Goal input
- `ext/goal` ownership by v138
- `GoalService`, steering templates, extension lifecycle hooks
- compaction, reconstruction, reload, cold resume, and rollout metadata improvements

Adapt upstream semantics where they collapse Goal steering to user-role:

- Do not accept `InternalModelContextFragment::role() == "user"` as the active Goal steering authority path.
- Do not treat source `"goal"` as sufficient authority.
- Do not let `ContextualUserFragment` or `TurnInputContributor` carry Goal through a static user-role concrete fragment.
- Do not replay stale `<goal_context>` or `<codex_internal_context source="goal">` from history as future authority.
- Do not rely on compaction summaries or stored transcript fragments to preserve an active Goal.

The durable design is:

```text
Goal state/progress can be durable data.
Goal steering authority must be freshly rendered or current-turn carried.
Old hidden steering frames are historical transcript/provenance only and must be excluded before future model-input assembly. They are not safe to retain in a request just because they are wrapped or source-labeled.
```

Terminology guardrail: "stale," "historical," "prior-wrapper," or "transcript" Goal context means a previously recorded model item from history/reconstruction. It does not mean the active Goal steering item for the current request. Historical Goal context should be filtered/excluded before future model input; active Goal steering should be freshly rendered or current-turn carried as developer-role model input by default.

## Cross-Cutting Symbol Map

### v135

`ContextualUserFragment` serializes messages with a role string, and `AdditionalContextDeveloperFragment` already proves that this machinery can emit developer-role messages. Goal still uses `GoalContext` / `<goal_context>`. The upstream/user-role Goal shape is not acceptable as authority, but the developer-role fragment precedent is useful.

### v136

`InternalModelContextFragment`, `InternalContextSource`, and `<codex_internal_context source="...">` appear. Active Goal steering moves from the prior `<goal_context>` wrapper toward the source-labeled internal wrapper.

Critical detail: upstream `InternalModelContextFragment` implements `ContextualUserFragment` with `role() -> "user"`. It is hidden from visible turn parsing and user-turn boundaries, but it is still user-role model input. This improves provenance but preserves the wrong authority.

The references to the prior wrapper do not mean v136+ should maintain two active Goal steering implementations. They mean persisted rollout/history from earlier versions, tests, or transitional reconstruction paths may still contain `<goal_context>` items, and those must remain recognizable for filtering/migration. The active v136+ Goal steering path should have one owner and one current wrapper shape for that version.

### v137

Context fragments move into `codex-context-fragments`. `ContextualUserFragment::role(&self)` becomes object-safe and boxed conversion appears. `TurnInputContributor` appears and returns boxed contextual fragments.

Contributor output preserves each fragment's own role, so it can be a long-term Goal injection surface if Goal supplies a developer-role fragment/item. It is not safe if Goal simply contributes upstream's user-role `InternalModelContextFragment`.

### v138

Goal runtime ownership finishes moving to `ext/goal`. That is desirable. The local contract should move with ownership instead of preserving core as a hidden second owner.

But upstream Goal steering still creates `InternalModelContextFragment(source="goal") -> user`. Ownership improves; authority is still wrong.

### v139

No major named-fragment abstraction changes. Pressure shifts to compaction, v2 residency/reload, external imports, concurrency, and app-server cleanup.

The v139 lesson is that stale hidden Goal fragments from reconstruction/reload/import must not be reintroduced into future model input. Active Goal authority should come from current Goal state plus fresh developer-role steering.

### v140

No fundamental Goal role fix upstream. New pressure comes from:

- `new_context` same-turn reset
- comp-hash-triggered pre-turn compaction
- remote compaction v2 defaulting
- compact window IDs / rollout reconstruction metadata
- cold resume source reuse
- plaintext agent messages and typed history serialization

Token-budget and realtime-role commits provide useful precedent: upstream already has developer-role contextual/model-input surfaces. Developer-role Goal steering is not a local side channel.

### upstream/main after v140

The explored symbols still show `InternalModelContextFragment(source="goal") -> user`. World State and extension world-state contribution APIs appear or continue evolving, but they do not solve Goal steering authority. World State may eventually carry durable Goal state/progress snapshots, not active steering authority, unless a role-aware steering channel is deliberately added.

## Version-by-Version Roadmap

### v136: Internal Context Pivot

Important commits from the research pass:

- `740d942f90` introduces `InternalModelContextFragment`, `InternalContextSource`, and `<codex_internal_context source="goal">`; Goal steering becomes hidden user-role internal context.
- `8f6a945ec9` moves active Goal steering toward `inject_if_running`.
- `1c7832ffa3` stores pending response items directly and changes injection/history semantics.
- `2a1158b8e2` expands app-server resume history with `initialTurnsPage`.
- `e7d156eb08`, `27e256bc40`, and `462deb0426` add turn-error/usage-limit/idle lifecycle surfaces.

Roadmap:

- Accept the internal-context wrapper and source labeling as provenance terrain.
- Adapt the Goal steering role boundary so active Goal steering is developer-role by default.
- Treat prior-wrapper `<goal_context>` items and current-wrapper `<codex_internal_context source="goal">` historical items as hidden/provenance markers for exclusion before request assembly. A stale historical Goal-context item with `role: "user"` must not be left in the future model request and discounted by prose or provenance; it has to be removed before request assembly and replaced, when a Goal is active, by freshly rendered developer-role Goal steering. This is compatibility/filtering for persisted history, not two active Goal implementations.
- Audit `inject_if_running` and direct `ResponseItem` storage so late or idle Goal injection cannot silently drop authority or persist unsampled hidden steering.
- Preserve app-server resume ordering, but filter/exclude raw resumed/internal Goal-context transcript items before they become future model input. If an old internal Goal item with `role: "user"` is replayed into the request, the model receives user-role Goal text; the API has no secondary flag that strips that role effect. Active Goal continuation after resume must instead be freshly rendered from current Goal state as developer-role model input by default.

### v137: Contributor And Fragment Pivot

Important commits:

- `f1b1b64005` adds Goal extension idle continuation.
- `c875bc8a33` moves Goal steering prompts into extension templates.
- `f27bbbd49c` adds Goal extension `GoalApi` / `GoalService`.
- `271d5cecf2` adds extension `TurnInputContributor`.
- `3389fa554e` narrows contributor output toward `ContextualUserFragment`.
- `ac67905fc4` extracts context fragments into `codex-context-fragments`.
- `96d2d2f68c` implements skills extension prompt injection, a useful non-Goal precedent.

Roadmap:

- Accept extension ownership growth, templates, `GoalService`, idle continuation, and fragment extraction.
- Adapt `TurnInputContributor` usage: Goal can use the contributor path only if the contributed Goal fragment/item is role-bearing developer input.
- Do not let the trait name `ContextualUserFragment` or upstream user-role concrete fragments define Goal authority.
- Keep skills and additional context as precedent only. They prove the conveyor exists; they are not Goal.
- Add or preserve tests for developer-role final request input, current-turn Goal steering through compaction, and app-server external Goal set/clear through extension-owned service paths.

### v138: Extension Ownership Pivot

Important commits:

- `479a14cf59` finishes moving Goal runtime to `ext/goal`.
- `a8c9530911` aligns Goal extension with core behavior.
- `c62d79259d` blocks active Goals after terminal turn errors.
- `d297616d3e` gates automatic idle turns in Plan mode.
- `4231472c03` rewrites oversized tool outputs during remote compaction.
- `d46a98d31a` bridges host-loaded skills into the skills extension.
- `5f4d06ef18` changes final model input serialization for encrypted multi-agent messages.

Roadmap:

- Accept `ext/goal` as the canonical Goal owner.
- Do not keep core Goal runtime as a hidden second authority after upstream ownership moves.
- Move the maintained local Goal contract into extension-owned runtime, steering, tools, lifecycle, and app-server mutation handling.
- Adapt active steering output: upstream still emits hidden user-role internal context.
- Treat terminal-error blocking carefully. Loop prevention is useful, but transient transport or compaction failures should not unnecessarily collapse active Goal pursuit unless that is the intended lifecycle policy.
- Ensure final serialization paths still preserve the developer role for Goal items.

### v139: Replay, Residency, Import, And Concurrency Hardening

Important commits:

- `f1c18df9ae` reports compaction analytics details and touches remote compaction v2 history behavior.
- `e127a0cf99` adds extra config to stored threads.
- `743f5aad38` counts v2 concurrency by active execution and explicitly exempts automatic idle continuations.
- `4e803a017c` adds v2 agent residency LRU.
- `0526cb56ac` avoids reopening v2 descendants on resume.
- `6d8e12ac42` speeds external agent session imports.
- `b128da272e` avoids blocking connection cleanup.
- `26d9329833` excludes external tool output from memories.
- `9e0d7f02c9` preserves auto-review across config/delegation, a useful pattern for carrying live authority rather than stale transcript authority.

Roadmap:

- Accept the v139 terrain, but keep Goal authority separate from thread environment, stored config, imported transcript, and agent residency state.
- Preserve `/goal` automatic idle-continuation exemption from generic v2 execution capacity limits.
- Treat `extra_config` as a future state/config channel only. Do not let it become replayed steering authority.
- On reload, import, fork, and reconstruction, stale hidden Goal wrappers must be excluded before future model-input assembly. If they are sent to the model, their outer message role still applies.
- Active Goal continuation should render fresh developer-role steering from current server/runtime state.

### v140: Same-Turn Reset And Remote Compaction Defaulting

Important commits:

- `36bf63a5cf` allows creating a new Goal after completion.
- `608b8b1cc6` emits Goal lifecycle analytics.
- `d2f6d23c6c` removes `async_trait` from extension contributors while preserving the same contributor role shape.
- `658af936fd`, `dac5f07403`, and `7516eb5c70` add token-budget context/tools and provide developer-role contextual precedent.
- `87ab01834a` adds the `new_context` tool, a same-turn history reset without summary.
- `30ddb3325e` stores compact window IDs in rollout.
- `ba4925b3c2` compacts when `comp_hash` changes.
- `273a4aa4f2` enables remote compaction v2 by default.
- `640d61b121` / `f297b9f07d` carry turn state over WebSocket/compact.
- `8f2d6416ce` changes plaintext agent message serialization.
- `6a9a49b334` avoids rereading rollout history during cold resume.
- `216dee1189` adds explicit roles to realtime append text.

Roadmap:

- Accept compaction, metadata, turn-state, app-server resume, analytics, and lifecycle terrain.
- Adapt Goal steering so active Goal state is re-established as developer-role current-turn input after `new_context`, remote v2 compaction, comp-hash compaction, or cold resume.
- Use token-budget and realtime-role commits as upstream precedent for developer-role model input.
- Historical `<goal_context>` and `<codex_internal_context source="goal">` must be filtered/excluded during reconstruction before future model-input assembly. Do not send stale historical Goal context as user-role model input and rely on prose/provenance to cancel the role.

## The Architectural Through-Line

For every upstream version, find the current conveyor:

```text
Goal lifecycle event
  -> Goal steering renderer
  -> hidden/provenance wrapper
  -> role-bearing model-item conversion
  -> active-turn / continuation injection
  -> compaction / reconstruction / resume handling
```

Then apply two invariants:

1. Producer-side authority: active Goal steering must be rendered from current Goal state and serialized with outer role `developer` by default.
2. Lifecycle/history authority: compaction, reconstruction, resume, reload, import, and late injection must not drop current-turn Goal authority or reintroduce stale hidden Goal frames into future model input.

The wrapper and the role answer different questions:

```text
wrapper/source:
  What is this? Who owns it? Should UI/history/compaction treat it as hidden internal context?

outer model-input role:
  What authority does this content have for the model?
```

Both are required. Hidden without developer role loses authority. Developer role without hidden/provenance behavior leaks runtime steering. Persisted hidden context without replay filtering can stale-revive old authority.

## Preferred Future Shape

The clean long-term shape is a role-aware internal model context or equivalent contributor:

```text
GoalSteeringFrame {
  kind: Initial | Continuation | BudgetLimit | ObjectiveUpdated,
  source: InternalContextSource::Goal,
  role: Developer by local default/config,
  body: rendered source-authority steering,
  objective: escaped inside <untrusted_objective>,
}

into model input:
  ResponseItem::Message {
    role: "developer",
    content: InternalModelContextFragment {
      source: "goal",
      body,
    }.render()
  }
```

If upstream later makes `InternalModelContextFragment` role-aware, use that. If it remains hardcoded to user-role, do not use it as the active Goal steering carrier and do not call a conversion path that emits its hardcoded user role. Use it only as a content/provenance renderer, or introduce a Goal-specific developer-role internal context fragment/contributor.

`TurnInputContributor` is a good long-term surface only when it can contribute role-bearing Goal input. If it returns boxed contextual fragments, Goal must provide a developer-role fragment or equivalent response item. A static user-role fragment remains invalid for active Goal steering.

World State or other future durable context systems may carry Goal state/progress snapshots. They should not carry active steering authority unless they include an explicit role-aware steering channel. Durable state is not the same as model instruction authority.

## Subagent Research Summary

Six explorers were used:

- v136 range: `rust-v0.135.0..rust-v0.136.0`
- v137 range: `rust-v0.136.0..rust-v0.137.0`
- v138 range: `rust-v0.137.0..rust-v0.138.0`
- v139 range: `rust-v0.138.0..rust-v0.139.0`
- v140 range: `rust-v0.139.0..rust-v0.140.0`
- cross-cutting abstraction map through v140 and upstream/main

All six converged on the same core fact:

```text
Upstream improves ownership/provenance/injection terrain,
but upstream Goal steering remains hidden user-role internal context through v140.
```

Therefore the roadmap should not be "use upstream internal context and stop." It should be "use upstream internal context as provenance and hiddenness, while adapting the Goal path so active steering remains developer-role by default."

## Warnings For Future Agents

Do not say "accept upstream" without naming what is accepted. Accept structure, ownership, and lifecycle terrain. Adapt authority semantics.

Do not preserve core as a hidden second owner after v138. Move the local contract into `ext/goal`.

Do not treat `InternalContextSource::Goal`, source labels, wrapper text, or hidden predicates as authority.

Do not treat `ContextualUserFragment` as forbidden merely because of its name. It can be usable only if the concrete Goal fragment's role is developer. A static user-role concrete fragment is not usable for active Goal steering.

Do not replay old Goal steering from history to preserve Goal. Preserve Goal state and render fresh steering into each request that needs it. Carry current-turn steering through mid-turn resets/compaction only as current-turn steering, preserving its developer role in the model request. Do not make old Goal steering a durable conversation/history item that later gets replayed as model input.

Do not let compaction/reconstruction tests become merely "hidden text is filtered." The important behavior is both:

- stale hidden Goal context is filtered/excluded before future model-input assembly; and
- active Goal authority is regenerated/carried as developer-role model input.

Do not ignore same-turn reset paths after v140. `new_context`, remote v2 defaulting, comp-hash compaction, and cold resume all increase the need for a request-time/current-turn Goal steering source.

## Good One-Sentence Summary

For v136-v140, integrate upstream's internal-context, contributor, extension-ownership, and compaction terrain, but make Goal steering a role-aware developer-authority frame whose content may use upstream provenance wrappers and whose authority is always freshly rendered from current Goal state rather than replayed from hidden transcript history.
