# Goal Authority Behavior

Status: Pass 2C staged successor. It becomes standing authority only through
cutover; closed sections are written as successor contract text.

## Role

This target is the behavioral contract for Goal authority. It defines what
counts as active Goal steering, what never counts as authority, and which
implementation shapes must be rejected even when they preserve Goal-looking
text.

This target owns:

- the behavior-level definition of Goal authority;
- the allowed active steering shape at the model-input boundary;
- the negative rules for helper output, hiddenness, projection, durable state
  alone, rendered markers, raw events, and tool output;
- the rejection of user-role active Goal steering as compatibility behavior;
  and
- the behavior-level requirement that any proof of active Goal authority be
  tied to the final model request input.

This target does not own cadence selection, durable state storage, exact-key
consumption, final request-input shaping mechanics, commit side effects, idle
lifecycle ordering, cleanup classifiers, recorded-evidence persistence,
extension lifecycle, fake-shim demolition, test-prep sequencing, or navigation.
Those targets keep local reminders only; they must not redefine the behavioral
authority rule.

## Behavioral Truth

A Goal has model authority only when the final per-attempt model request input
contains current Goal steering as an outer developer-role model item.

The behavior-level proof surface is the logical input list that becomes
`Prompt.input` and then `ResponsesApiRequest.input`. A Goal item can contain
source-tagged internal-context text such as `source = "goal"` only as
provenance and cleanup support. The outer developer role in the final request
input carries authority.

The active Goal item is current only when it represents the current durable
Goal facts selected for that request opportunity. Durable state supplies facts;
it does not itself prove that the model received Goal authority.

## Required Active Steering Boundary

Active Goal steering must be established at the final request-input shaping
point: the logical `Vec<ResponseItem>` that becomes `Prompt.input` and then
`ResponsesApiRequest.input`.

Generic internal-context helpers are limited to rendering Goal text, carrying
source provenance, and supporting cleanup classification. They are not the
authority mechanism. The existing Goal-only active context path is deletion
terrain for active steering, not architecture to preserve, keep in place, or
design around.

The behavior-level responsibility split is:

- Goal cadence selects whether Goal steering is due for a request;
- internal-context rendering owns text, provenance, and classification support
  only; and
- `ResponseItem::Message.role` on the selected final-input item is the model
  authority source.

Adding `Developer` to a role enum or adding a helper that can produce a
developer-role item is insufficient by itself. Authority is proven only when
the final model request input contains exactly one selected current Goal
`ResponseItem::Message` whose outer role is `developer`.

Active Goal steering must not use `ContextualUserFragment::into(...)` or any
equivalent conversion path that hardcodes, defaults, or infers `role = "user"`.
There is no user-role active Goal steering path.

If older configuration exposes a Goal steering role override, implementation
must remove it, reject it, or hard-map it to developer-role behavior. It must
not preserve user-role Goal steering as compatibility.

## Behavior-Level Item Shape

At this level, active Goal steering is a selected current
`ResponseItem::Message` whose outer role is `developer`.

The behavioral shape is:

```rust
let text = render_internal_goal_context(rendered_goal_prompt);
ResponseItem::Message {
    role: "developer",
    content: vec![ContentItem::InputText { text }],
    ..
}
```

The message body uses the current internal-context representation to render
Goal text, identify `source = "goal"`, include the current Goal steering body,
and escape the objective as untrusted text. Exact rendering helpers and
per-attempt insertion or verification mechanics belong to the final
request-input target. They do not create authority unless the selected item is
present in the final model request input.

## Invalid Proof Substitutes

None of these prove active Goal authority by themselves:

- durable Goal state;
- rendered Goal text;
- source tags or internal-context provenance;
- helper output that can produce a developer-role item;
- a role enum that contains a developer variant;
- raw response item notifications;
- app-server, TUI, or other projections;
- hidden classification or invisible metadata;
- tool output that reports Goal state;
- pre-request concrete model-input items;
- active-turn injection, reservation, or same-turn request metadata;
- Goal-only active context paths such as `GoalContext`, `GoalContextRole`,
  active `<goal_context>`, or `ContextualUserFragment::into(...)`;
- configuration that claims to select a Goal steering role; or
- legacy `<goal_context>` artifacts.

User-role active Goal steering is invalid. Provenance text, source tags, or
compatibility wording cannot compensate for the wrong outer model role.

## Anti-Patterns

### Goal Every Turn

Active Goal state must not become repeated full Goal reminders on every
ordinary user turn. Active durable Goal state alone is not a cadence event and
is not cadence-required authority.

### User-Role Goal Steering

Active Goal steering must not be emitted as user-role input. Provenance text,
source tags, compatibility wording, or preserved configuration cannot
compensate for the wrong outer model role.

### Rendered Text As Authority

`<goal_context>` and `source = "goal"` are not authority. They are rendered
text, legacy artifact markers, provenance, or cleanup support. The outer model
role on the selected final-input item carries authority.

### Goal-Only Fake Provenance

Active Goal steering must not be built around a Goal-specific active context
helper. It must not be replaced by another helper-only authority layer. Generic
internal context can render and classify text; final request input owns
authority.

The Goal-only active context path must not remain an active-path subsystem under
compatibility or migration language.

### Runtime Archaeology

Runtime behavior must not parse rendered Goal artifacts to recover active Goal
state, current objective text, budget state, cadence intent, or pending
steering kind.

### Tool Output As Steering

Tool output can report Goal state. It is not Goal steering.

### Hiddenness As Authority

UI hiding, hidden classification, and invisible metadata do not prove that the
model received Goal authority.

### Repair As Cadence

Request repair must not become the primary mechanism that decides when Goal
steering is due. Repair is request-local support for preserving or repairing
cadence-required authority; it is not cadence selection.

## Reader Metadata

Reader maps route behavioral-authority questions here and route final
request-input mechanics to the final-input target. Navigation text stays a
reader aid, not a second behavior contract.

Current terrain anchors named by the source corpus include
`codex-rs/core/src/session/turn.rs`,
`codex-rs/core/src/client_common.rs`,
`codex-rs/codex-api/src/common.rs`, and
`codex-rs/core/src/context/goal_context.rs`. These are terrain anchors, not
permission to preserve current broken active-shim behavior.
