# Draft Authority Map

This map sketches the future live documentation surface for skill/plugin/app
invocation semantics. It is a draft, not an instruction to create these exact
files.

## Core Rule

The future authority surface should answer this before implementation:

```text
What makes a model-visible mention operative?
```

A response-shaped item containing `$skill` text is not enough. The authority
surface must identify the accepted source, the mention kind, the resolution
rule, the injection effect, and the proof surface.

## Candidate Future Live Docs

| Candidate doc | Role | Owns | Does not own |
| --- | --- | --- | --- |
| `AGENTS.md` | Reading posture and non-negotiables for invocation work. | Authority order, conflict handling, validation posture. | Full behavior rules. |
| `README.md` | Reader route and terrain anchors. | Which doc answers which question. | Behavior authority. |
| `CONTEXT.md` | Glossary only. | Short canonical terms such as operative invocation and invocation-bearing source. | Edge cases, source policy, proof. |
| `invocation-authority.md` | Behavioral authority for operative invocation. | What counts as operative; forbidden substitutes; relationship among skills, plugins, and apps. | Source corpus details, collector mechanics, request placement. |
| `source-provenance.md` | Source classification contract. | Which source categories are invocation-bearing, model-visible-only, quoted/evidence, replay, or rejected. | Mention syntax, skill metadata resolution, final injection rendering. |
| `mention-resolution.md` | Mention extraction and resolution contract. | Structured selections, plain text mentions, linked mentions, ambiguity, disabled skills, app/plugin path kinds. | Source eligibility and injection placement. |
| `injection-placement.md` | Runtime placement and effect contract. | When detection runs; where injected guidance is added; how skills/plugins/apps differ in effect. | Source eligibility and low-level parser rules. |
| `proof-and-readiness.md` | Proof matrix and readiness gate. | Test clusters, negative proof, implementation-plan readiness, cold-reader review. | Behavior rules. |

## First Ownership Instincts

- `invocation-authority.md` should own the sentence: model visibility does not
  make a mention operative.
- `source-provenance.md` should own the source taxonomy and any allowlist or
  rejection policy.
- `mention-resolution.md` should own how mentions become skill/plugin/app
  identities after a source is accepted for scanning.
- `injection-placement.md` should own where runtime side effects enter the turn
  or prompt.
- `proof-and-readiness.md` should own the rule that tests prove final outbound
  effects and rejected-source negatives, not helper internals.

## Non-Ownership Reminders

- Current `TurnInput::UserInput` filtering is terrain, not authority.
- Current `ResponseItem` role is terrain, not authority.
- Existing product docs under `docs/skills.md` are usage documentation, not the
  local authority model for runtime invocation semantics.
- Goal request-input authority docs are related process inspiration and type
  terrain, not owners of skill/plugin/app invocation behavior.
- Subagents docs own thread-spawn subagent behavior; they do not decide whether
  inter-agent messages can invoke skills.

## Readiness Requirements

Before implementation planning starts, the authority map must answer:

- Is there one shared source policy for skills, plugins, and apps?
- What source categories are accepted, rejected, or open?
- Which mention forms are supported for each accepted source?
- What injection effects must happen for each mention family?
- Where in the turn/request lifecycle does detection run?
- Which negative cases must never inject guidance or expose tools?
- Which future doc owns each answer?

