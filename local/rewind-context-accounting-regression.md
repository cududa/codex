# Rewind Context Accounting Regression

Date: 2026-07-23

## Thesis

Codex rewind currently has a serious harness-level semantic bug: after a user
rewinds, the transcript can move backward while the context/status accounting
moves forward or sideways under a different accounting model.

The most important finding from this investigation is not that rollback failed
to drop the requested turn. In the sampled session, rollback did drop the
requested suffix. The damaging behavior is that the user-facing context number
switches from backend-reported API usage to a local reconstructed-history byte
estimate, and the TUI displays both numbers as if they were the same kind of
measurement.

That breaks the human affordance of rewind. A user reasonably expects rewind to
restore a prior conversation state and recover context headroom. Instead, a
rewind can show less remaining context than before, can push the session toward
auto-compaction, and can make the agent behave as though the user asked it to
continue inside a larger or differently shaped hidden state than the visible
transcript implies.

I would classify this as a product and architecture bug unless a deliberate
design document says otherwise. Even then, the UX contract is still wrong:
calling the operation "rewind" while retaining or inflating invisible context
pressure is misleading.

## Why This Matters

Rewind is not just a convenience command. It is a core human-agent recovery
mechanism.

Good rewind behavior lets a user take responsibility for a bad prompt, discard
the failed branch, rewrite the instruction, and continue from a simpler state.
That avoids asking an already-context-constrained model to repair a mess created
by ambiguous or underspecified human communication.

When rewind instead reduces reported context remaining, the user loses the
primary reason to use it:

- the visible transcript suggests that the session moved backward;
- the context meter suggests that the session got worse;
- auto-compaction may trigger at exactly the moment the user expected relief;
- the model may then receive a compressed or differently reconstructed history;
- the user sees degraded behavior and may blame the model rather than the
  harness.

At large scale, this kind of bug wastes three things at once: user time, model
tokens, and trust. A public X post from Tibo Sottiaux reported "10M" Codex and
ChatGPT Work users on 2026-07-21/2026-07-22. I am not using that as a precise
active-rewind population estimate. I am using it as scale context: if even a
small fraction of that audience hits rewind/accounting regressions, the aggregate
cost is not small.

## Known Environment

The affected local session was running the installed local Codex route, not the
current v136 branch build.

- Current repo branch: `review/openai-v0.136.0-on-cududa-v0.135.0`
- Installed CLI: `codex-cli 0.134.0`
- Installed npm packages:
  - `@cududa/codex@0.134.0-cududa`
  - `@cududa/codex-sdk@0.134.0-cududa`
- Existing dirty file before this investigation:
  - `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md`

That means the observed behavior should not be dismissed as a byproduct of the
current v136 branch. The strongest local evidence comes from behavior in the
installed v134 route.

## Version Range Context

The local and upstream tag topology matters because the current work branch is a
v136-forward branch, while the observed binary was v134.

Previously verified facts:

- `cududa-v0.133.0..cududa-v0.135.0`
  - 185 commits by reachable delta
  - 37 commits by ancestry path
  - 10 commits on first-parent
- Direct local first commit after `cududa-v0.133.0`:
  - `f3693105771305e329a91a6ab501819ee5074422`
  - `Merge pull request #3 from cududa/review/openai-v0.133.0-on-cududa-v0.132.0`
- `rust-v0.133.0..rust-v0.135.0`
  - 147 commits by reachable delta
  - not a clean ancestry path between release tags
  - merge base observed at `0b4f86095c8005d8f74e9c62b971d72c1670aa88`

The practical consequence: source review should prioritize the built version
window first, especially `rust-v0.132.0..rust-v0.134.0` and
`cududa-v0.133.0..cududa-v0.134.0`, before attributing anything to v135 or v136.

## Rewind Path

The relevant code path crosses four layers.

TUI rewind/backtrack:

- `codex-rs/tui/src/app_backtrack.rs`
- `codex-rs/tui/src/app/thread_routing.rs`
- `codex-rs/tui/src/app/thread_events.rs`

App-server rollback:

- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

Core rollback/reconstruction:

- `codex-rs/core/src/session/handlers.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/context_manager/history.rs`

Token display/accounting:

- `codex-rs/core/src/session/mod.rs`
- `codex-rs/tui/src/chatwidget/status_controls.rs`
- `codex-rs/tui/src/token_usage.rs`

The core sequence in rollback is:

1. Load stored thread history.
2. Append a `ThreadRolledBack` event to the replay stream.
3. Reconstruct live history from rollout items.
4. Recompute token usage from the reconstructed history.
5. Persist the rollback marker.
6. Emit the rollback event/status to clients.

The source anchor is `codex-rs/core/src/session/handlers.rs`:

```rust
let rollback_event = ThreadRolledBackEvent { num_turns };
let rollback_msg = EventMsg::ThreadRolledBack(rollback_event.clone());
let replay_items = stored_history
    .items
    .into_iter()
    .chain(std::iter::once(RolloutItem::EventMsg(rollback_msg.clone())))
    .collect::<Vec<_>>();
sess.apply_rollout_reconstruction(turn_context.as_ref(), replay_items.as_slice())
    .await;
sess.recompute_token_usage(turn_context.as_ref()).await;
```

The recompute path is `codex-rs/core/src/session/mod.rs`:

```rust
pub(crate) async fn recompute_token_usage(&self, turn_context: &TurnContext) {
    let history = self.clone_history().await;
    let base_instructions = self.get_base_instructions().await;
    let Some(estimated_total_tokens) =
        history.estimate_token_count_with_base_instructions(&base_instructions)
    else {
        return;
    };

    // ...

    info.last_token_usage = TokenUsage {
        input_tokens: 0,
        cached_input_tokens: 0,
        output_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: estimated_total_tokens.max(0),
    };

    // ...

    self.set_auto_compact_window_estimated_prefill_for_scope(
        turn_context,
        estimated_total_tokens,
    )
    .await;
    self.send_token_count_event(turn_context).await;
}
```

That code is the signature seen in the rollout: a token count event with
`input_tokens=0`, `cached_input_tokens=0`, `output_tokens=0`, and only
`total_tokens` populated.

## Rollout Evidence

Primary forensic session:

```text
%USERPROFILE%\.codex\sessions\2026\07\22\rollout-2026-07-22T17-03-05-019f8ba3-a423-7430-9344-553adc91e922.jsonl
```

Current session, used only for ancillary compaction comparison:

```text
%USERPROFILE%\.codex\sessions\2026\07\23\rollout-2026-07-23T01-14-48-019f8d65-d2a0-7dd1-ad13-88d90654851b.jsonl
```

The primary rollout contained 13 rollback events. Most increased the displayed
token total at rollback time.

| Rollout Line | Time | Before Total | Rollback Total | Token Delta | Before Left | Rollback Left | Left Delta |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 93 | 21:10:37 | 39,365 | 42,297 | +2,932 | 88.9% | 87.7% | -1.2 |
| 102 | 21:11:31 | 42,297 | 42,297 | 0 | 87.7% | 87.7% | 0 |
| 388 | 21:28:35 | 132,114 | 147,951 | +15,837 | 51.3% | 44.8% | -6.4 |
| 658 | 22:18:40 | 100,732 | 108,450 | +7,718 | 64.0% | 60.9% | -3.1 |
| 838 | 22:28:39 | 191,523 | 211,721 | +20,198 | 27.1% | 18.9% | -8.2 |
| 1291 | 00:03:04 | 76,891 | 24,238 | -52,653 | 73.7% | 95.0% | +21.4 |
| 1374 | 00:06:00 | 86,439 | 24,238 | -62,201 | 69.8% | 95.0% | +25.2 |
| 1681 | 00:34:59 | 149,915 | 164,374 | +14,459 | 44.0% | 38.2% | -5.9 |
| 1697 | 01:02:47 | 150,064 | 165,208 | +15,144 | 44.0% | 37.8% | -6.1 |
| 1713 | 01:05:30 | 152,737 | 165,208 | +12,471 | 42.9% | 37.8% | -5.1 |
| 1789 | 04:00:57 | 174,563 | 195,491 | +20,928 | 34.0% | 25.5% | -8.5 |
| 1885 | 04:04:21 | 224,297 | 251,447 | +27,150 | 13.8% | 2.8% | -11.0 |
| 2407 | 05:06:20 | 173,905 | 189,038 | +15,133 | 34.3% | 28.2% | -6.1 |

The user's reported symptom was context remaining decreasing by roughly 3-14%
after rewinds. This rollout independently reproduces that shape: positive
rollback deltas range from about -1.2 to -11.0 percentage points of displayed
context remaining in this sample.

## The Most Important Boundary

The last rollback boundary is the cleanest sample because the records around it
are easy to interpret:

| Line | Event | Summary |
| ---: | --- | --- |
| 2401 | `token_count` | backend-style usage, `total=173674` |
| 2404 | `token_count` | backend-style usage, `total=173905` |
| 2405 | `task_complete` | prior task complete |
| 2406 | `token_count` | recomputed usage, `total=189038`, components all zero |
| 2407 | `thread_rolled_back` | `num_turns=1` |
| 2408 | `task_started` | next task starts much later |

The exact usage payloads:

```json
{
  "line": 2404,
  "last_token_usage": {
    "input_tokens": 173687,
    "cached_input_tokens": 173440,
    "output_tokens": 218,
    "reasoning_output_tokens": 0,
    "total_tokens": 173905
  }
}
```

```json
{
  "line": 2406,
  "last_token_usage": {
    "input_tokens": 0,
    "cached_input_tokens": 0,
    "output_tokens": 0,
    "reasoning_output_tokens": 0,
    "total_tokens": 189038
  }
}
```

That is not a normal API usage report. It is exactly the shape produced by
`recompute_token_usage`.

This matters because it rules out a purely TUI-local display bug. The TUI is
displaying a bad or incomparable value that core emitted. The bug is upstream of
the status widget.

## What The "Extra 6%" Was In The Sample

I did a bounded local replay of the normal rollout JSONL up to line 2407:

- collect `response_item` records into a synthetic history;
- replace history on `compacted` records that carry `replacement_history`;
- apply `thread_rolled_back` by cutting at the last user-message boundary;
- estimate byte/token mass by item category without printing transcript content.

This is not a substitute for the Rust estimator, but it was close enough to
validate the mechanism.

Before rollback recompute:

- item count: 387
- approximate item tokens: 198,655
- approximate item bytes: 794,620

After applying rollback:

- item count: 319
- approximate item tokens: 183,531
- approximate item bytes: 734,123

Dropped suffix:

- item count: 68
- approximate item tokens: 15,125
- approximate item bytes: 60,497

The post-rollback estimate plus base instructions:

```text
183,531 item tokens + ~5,507 base-instruction tokens = 189,038
```

That exactly matches the emitted `total_tokens=189038`.

So the "extra 6%" in this boundary is best described as an accounting-source
discontinuity:

- rollback really dropped about 15k estimated tokens from reconstructed history;
- but the previous displayed number was backend-reported `173,905`;
- the rollback displayed number was local-estimated `189,038`;
- therefore the user sees a 15k-token increase after a successful drop.

The hidden failure is not "nothing was removed." The failure is "the number
shown after removal is measured with a different ruler."

## What Dominates The Estimate

The post-rollback reconstructed history estimate was dominated by tool output.

Top estimated categories after rollback:

| Kind | Count | Approx Bytes | Approx Tokens |
| --- | ---: | ---: | ---: |
| `function_call_output` | 83 | 446,623 | 111,656 |
| `message:user` | 50 | 98,386 | 24,597 |
| `custom_tool_call` | 13 | 68,263 | 17,066 |
| `function_call` | 83 | 33,927 | 8,482 |
| `reasoning` | 36 | 27,948 | 6,987 |
| `message:developer` | 2 | 19,595 | 4,899 |
| `message:assistant` | 38 | 17,851 | 4,463 |
| `compaction` | 1 | 17,440 | 4,360 |
| `custom_tool_call_output` | 13 | 4,090 | 1,023 |

For `function_call_output` specifically:

- count: 83
- total persisted output characters: 422,792
- largest output: 22,833 characters
- top 10 output lengths:
  - 22,833
  - 18,066
  - 15,248
  - 13,303
  - 12,625
  - 11,232
  - 10,822
  - 10,814
  - 10,752
  - 10,497

This makes the estimator vulnerable to any mismatch between:

- what the backend actually counted in the previous request;
- what the persisted rollout stores;
- what compaction replacement history retained;
- what the local byte heuristic thinks a stored item will cost in a future
  request.

The estimate may be useful as an internal lower/upper-ish heuristic for
truncation. It is not suitable as a user-facing replacement for API usage without
explicitly distinguishing it in the UI and in compaction policy.

## Auto-Compaction Interaction

The compaction angle is not separate. Rollback recompute also feeds
auto-compaction prefill state:

```rust
self.set_auto_compact_window_estimated_prefill_for_scope(
    turn_context,
    estimated_total_tokens,
)
.await;
```

Blame points that line at:

```text
80fdd4688f6fa8143488c206d4c14dc193905254
Add `body_after_prefix` auto-compact token limit scope (#22870)
```

That commit is in the relevant v134-era range and touched:

- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/state/auto_compact_window.rs`
- config/schema/protocol surfaces
- compaction tests

The auto-compaction trigger path computes:

```rust
let active_context_tokens = sess.get_total_token_usage().await;
// ...
let baseline = window.prefill_input_tokens.unwrap_or(active_context_tokens);
let auto_compact_scope_tokens = active_context_tokens.saturating_sub(baseline);
```

For `AutoCompactTokenLimitScope::BodyAfterPrefix`, the intended idea appears to
be: do not charge a carried prefix against the per-window growth budget. That is
a reasonable concept. The problem is that rollback recompute can write a local
estimate into the same accounting stream the UI and compaction machinery rely
on.

Observed in the same rollout:

| Line | Event | Total |
| ---: | --- | ---: |
| 1881 | `token_count` | 224,297 |
| 1884 | rollback recompute `token_count` | 251,447 |
| 1885 | `thread_rolled_back` | n/a |
| 1888 | post-compaction `token_count` | 24,089 |
| 1889 | `context_compacted` | n/a |

That is the pathological user experience in miniature:

1. The user rewinds one turn.
2. Context appears to get dramatically worse.
3. The next turn immediately compacts.
4. The user loses the clean pre-failure conversational shape they were trying to
   recover.

This is the opposite of the expected rewind affordance.

One caveat: `AutoCompactTokenLimitScope` defaults to `Total` in config, and I did
not find `model_auto_compact_token_limit_scope = "body_after_prefix"` in the
local user config. So `80fdd4688f` may not be the cause of every observed
context-meter jump. It is still a high-value suspect for the compaction-side
behavior because it explicitly connected recomputed estimates to compaction
prefill state.

## Candidate Commits And Areas

### Strong Candidate For Compaction Side Effects

```text
80fdd4688f6fa8143488c206d4c14dc193905254
Add `body_after_prefix` auto-compact token limit scope (#22870)
```

Why it matters:

- adds auto-compaction window state;
- changes pre-turn compaction thresholding;
- causes recomputed estimates to seed estimated prefill for the scoped window;
- landed in the v134-era range.

This does not by itself explain why the visible number switches after rewind.
The recompute existed earlier. It does explain how the bad/incomparable number
can become operationally significant for compaction.

### Existing Mechanism That Makes Rewind Display Incomparable Usage

The basic rollback-then-recompute path predates v133-v135:

- rollback reconstruction and recompute blame to older commits;
- `recompute_token_usage` has long set component usage to zero while populating
  only `total_tokens`;
- the UI uses `last_token_usage.total_tokens` for remaining-context display.

If users only recently started feeling this hard, likely explanations include:

- more tool output is now retained in persisted history;
- compaction replacement history changed shape;
- additional context or turn-input changes increased reconstructed-history mass;
- auto-compaction thresholds now interact with the recomputed estimate;
- model/backend token usage became more cached/prefix-aware, increasing the gap
  between server-reported request usage and local full-history estimates.

### Other Nearby Areas Worth Reviewing

```text
34aad43684 add encryptedcontent to functioncalloutput (#23500)
```

This changed function-call-output representation and estimator correction logic.
The sampled normal rollout still persisted plain output strings, but function
outputs dominate the estimate, so this remains relevant to any historical
comparison.

```text
fbd4efa9ed6b9fe13dacd56247cc714903df72b7
[codex] Use TurnInput for session task input (#24151)
```

This is already implicated in a separate skill-invocation bug documented at
`local/skill_invocation_bug.md`: some model-visible input can be non-operative
for harness-level skill/plugin detection. It is not direct evidence for the
rewind bug, but it is thematically related: visible transcript semantics diverge
from harness semantics.

```text
768848ab6fc6f05f19c447786fd76fd233fa1d69
Add experimental turn additional context (#24154)
```

Worth reviewing if reconstructed history starts retaining/reinjecting context
items that were not part of the user's expected rewind boundary.

```text
7e802b22f13e2714efd2fb2a6e396319958d6506
Expose conversation history to extension tools (#23963)
```

Worth reviewing because any new consumer of conversation history can create
pressure to preserve history in forms that are useful for tools but harmful for
rewind semantics.

## Relation To The Skill Invocation Bug

`local/skill_invocation_bug.md` describes a separate but philosophically similar
failure:

- skill text can be visible to the model;
- runtime skill invocation does not occur;
- the transcript looks like one thing happened;
- the harness did another thing.

The rewind accounting issue has the same architecture smell:

- transcript rollback can be visible and real;
- hidden accounting can be recomputed under a different model;
- context status can report worse headroom after a successful rewind;
- compaction can act on that altered accounting.

Both bugs violate the same user mental model: what the user sees in the
conversation should correspond to the operational state the harness will use.
When those diverge, users blame the model for behavior that is actually
orchestrated by the harness.

## What Is Fact vs Inference

Facts established in this pass:

- A local v134 session emitted rollback-adjacent token counts that increased
  remaining-context pressure after `thread_rolled_back`.
- The rollback token counts have the exact component shape emitted by
  `recompute_token_usage`: only `total_tokens` populated.
- The sampled rollback dropped a suffix of reconstructed history.
- The post-rollback total equals a local byte-estimated item count plus base
  instructions.
- The TUI remaining-context display is driven by `last_token_usage.total_tokens`.
- Function-call outputs dominate the sampled reconstructed-history estimate.
- One rollback in the same rollout jumped to `251,447` tokens, then immediately
  compacted to `24,089`.
- The line connecting recomputed estimated totals to auto-compaction prefill was
  introduced by `80fdd4688f`.

Inferences:

- The user-facing bug is primarily an accounting-source discontinuity, not
  necessarily failure to trim.
- Recent architecture changes likely made the old recompute behavior much more
  user-visible and operationally harmful.
- The compaction side effect is plausibly tied to the v134 `body_after_prefix`
  work, but the exact configured path still needs a targeted test.
- This class of bug likely contributes to user reports that Codex gets confused
  after rewind, because compaction/reconstruction can silently change the hidden
  prompt shape immediately after a user tries to restore a prior state.

Not yet proven:

- The exact first bad upstream commit.
- Whether upstream intended rewind to retain any hidden state beyond the visible
  rollback boundary.
- Whether the same bug reproduces identically on pristine upstream v134/v135
  without local changes.
- Whether current upstream has made this better, worse, or merely different.
- Whether the auto-compaction disappearance observed in the current session is
  caused by the same accounting path or by changed thresholds/configuration.

## Back-Of-The-Envelope Impact

This section is intentionally rough. It is here to keep the scale of the problem
visible, not to pretend we have production telemetry.

Assume:

- 10 million Codex / ChatGPT Work users as public scale context;
- only 1% use rewind on a given heavy-use day;
- only 20% of those hit a harmful accounting jump;
- each harmful jump burns one extra 15k-token turn or compaction-equivalent;
- token waste is counted only for the avoidable extra context churn, not the
  downstream human recovery time.

That gives:

```text
10,000,000 users
* 1% rewind users
* 20% harmful cases
* 15,000 tokens
= 300,000,000 avoidable tokens/day
```

If the real affected population is 0.1%, the number is still 30 million tokens
per day. If repeated rewinds, failed repair turns, or compaction-induced
misalignment are included, the multiplier can grow quickly.

I am deliberately not converting this to a confident CO2 number. The carbon
intensity of inference depends on model, hardware, datacenter power mix,
batching, cache hit rates, and whether the wasted work displaces otherwise idle
capacity. But the qualitative point does not need a precise emissions model:
avoidable harness churn at this scale is materially wasteful.

The bigger impact may be human rather than electrical:

- users spend time diagnosing model behavior that is actually harness behavior;
- agents spend turns recovering from invisible state transitions;
- users lose trust in rewind as a recovery tool;
- people get angry at the model for "lying" or "acting different";
- support, social media, and community debugging all chase symptoms instead of
  the broken state contract.

That is not a minor polish issue.

## Desired Product Contract

A rewind operation should satisfy a simple contract:

1. The visible transcript after rewind should correspond to the model-visible
   conversation state used for the next turn.
2. Reported context remaining after rewind should be comparable to the number
   shown before rewind.
3. If the system must switch from API usage to local estimate, the UI and
   compaction logic must not treat the estimate as an equivalent replacement.
4. Rewind should not, by itself, increase compaction pressure unless the retained
   model-visible history truly increased.
5. If hidden retained state exists by design, the product should expose that
   state honestly enough for an expert user to reason about it.

In short: rewind should restore a usable previous state, not merely trim the
rendered transcript.

## Fix Direction I Would Favor

I would not start with a broad rewrite. The first fix should make the accounting
contract honest and prevent compaction from punishing users for rewinding.

Potential fix shape:

1. Split token usage provenance.
   - API-observed usage and local-estimated reconstructed usage should not occupy
     the same unlabelled `last_token_usage` slot.
   - A recomputed estimate can exist, but the UI and compaction policy should
     know it is estimated.

2. Preserve comparable display semantics after rollback.
   - If the last API-observed usage before rollback is available, avoid replacing
     the displayed context meter with a full-history local estimate unless the UI
     labels it as estimated.
   - Better: recompute an estimated delta relative to the last observed API usage
     rather than replacing the measurement source wholesale.

3. Make rollback tests assert monotonic user-facing behavior.
   - Given a history with a known last API usage and a rollback of one user turn,
     the emitted user-facing remaining-context signal should not get worse solely
     because measurement switched from API usage to local estimate.
   - If exact monotonicity is impossible, the emitted event should carry
     provenance so the UI can avoid false precision.

4. Keep auto-compaction from acting on a rollback artifact.
   - A rollback recompute should not seed a prefill baseline or trigger
     compaction as though it were a normal model-sampling usage report.
   - If a recomputed estimate is needed for safety, use it as a guardrail, not as
     the primary user-facing or growth-budget measurement.

5. Add a regression fixture based on the observed shape.
   - History with heavy function-call outputs.
   - Last backend token usage lower than the local full-history estimate.
   - Rollback one user turn.
   - Assert suffix is dropped.
   - Assert emitted token event does not misrepresent local estimate as normal
     backend usage.
   - Assert auto-compaction prefill behavior does not immediately punish rewind.

## Next Investigation Steps

If I were continuing from here, I would do these in order:

1. Write a minimal failing test around `thread_rollback` or the lower-level
   reconstruction/recompute boundary.
2. Make the test capture token-usage provenance, not just numeric total.
3. Compare the same test against `rust-v0.132.0`, `rust-v0.133.0`,
   `rust-v0.134.0`, and `rust-v0.135.0`.
4. Inspect `80fdd4688f` specifically for auto-compaction behavior changes.
5. Inspect whether v135/v136 additional-context changes cause hidden retained
   items to survive rollback in cases not covered by this sample.
6. Separately investigate why current-session local auto-compaction had zero
   actual `context_compacted` events despite low remaining context.

I would not start with a binary bisect unless the focused test fails to isolate
the semantic break. The rollout evidence already points to the contract
violation: post-rollback status uses a different accounting source.

## Bottom Line

This is a high-impact harness bug because it breaks a recovery affordance users
depend on to collaborate calmly with the agent.

The sampled rollback did remove history. Codex then reported context using a
coarse local reconstructed-history estimate that was higher than the previous
backend usage report. The UI presented that as ordinary context usage. In at
least one nearby case, the jump was followed immediately by compaction.

That is enough to justify owning this as a real issue, writing a targeted
regression test, and fixing the token-accounting/provenance contract before
chasing narrower symptoms.
