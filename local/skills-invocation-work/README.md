# Skills Invocation Research Work Packet

This directory is operational scaffolding for researching and planning durable
skill, plugin, and app invocation semantics.

The current bug frame is:

```text
Response-shaped turn input can contain model-visible text that looks like a
skill invocation, but runtime skill/plugin mention collection currently scans
only `TurnInput::UserInput`.
```

This packet is not behavior authority. It exists to produce the research
artifacts needed before a Rust implementation plan is named.

## Locked Intent

The research route is locked to these five deliverables:

1. Build a source corpus map.
2. Create a concept ledger.
3. Create an open-decision log.
4. Draft an authority map.
5. Define proof and readiness before implementation.

Do not skip from the bug report to code options. The implementation shape
should follow only after these deliverables can distinguish model-visible text
from operative invocation authority.

## Use Order

1. Read `tasks.md`.
2. Read `source-corpus-map.md` for the current terrain inventory.
3. Read `concept-ledger.md` for candidate terms and their status.
4. Read `open-decisions.md` before naming any implementation shape.
5. Read `authority-map.md` for the draft future live-doc shape.
6. Read `proof-and-readiness.md` for the readiness gate before implementation
   planning.
7. Pick the next unchecked slice in `slices/`.
8. Use `task-alignment` and emit a Direction Lock before editing work-packet
   or future live docs.

## File Roles

- `tasks.md`: executable queue for the five locked deliverables.
- `source-corpus-map.md`: current inventory of source paths, producers,
  consumers, and source categories to inspect.
- `concept-ledger.md`: temporary extraction table for terms and facts.
- `open-decisions.md`: decisions that must not be silently resolved from
  current source shape.
- `authority-map.md`: draft map for future live authority docs and their
  ownership seams.
- `proof-and-readiness.md`: proof posture, readiness criteria, and candidate
  proof clusters.
- `slice-template.md`: template for adding or refining bounded passes.
- `slices/*.md`: work briefs for each locked deliverable.

## Operating Rules

- Treat current code as terrain until a fact is moved into a future owning live
  doc or explicitly accepted as work-packet posture.
- Keep one durable rule in one future owning doc.
- Use `Module`, `Interface`, `Implementation`, `Seam`, `Adapter`, `Depth`,
  `Leverage`, and `Locality` deliberately when discussing design shape.
- Do not treat model visibility as invocation authority.
- Do not treat source role, message role, or `ResponseItem::Message` shape as
  sufficient proof that a mention should be operative.
- Do not let structured selections, plain text mentions, linked mentions,
  skill body injection, plugin guidance, and app/tool exposure collapse into
  one undifferentiated mechanism.
- Record uncertain behavior in `open-decisions.md`; do not smooth it over in
  prose.

## Relationship To Future Live Docs

The likely future live doc set does not exist yet. This packet should help
decide whether to create one and what it should own.

Candidate future live docs are listed in `authority-map.md`. Those names are
drafts, not commitments. If research finds a better ownership split, update
the map before writing any live authority prose.

## Stop Conditions

Stop and return to the user when:

- source terrain and intended invocation semantics directly conflict;
- one rule appears to belong to more than one future owning doc;
- a source category cannot be classified without deciding product behavior;
- a proposed implementation would make quoted transcripts, tool output,
  guardian evidence, compaction output, or replay artifacts operative by
  accident;
- proof expectations would validate helper output rather than final outbound
  request input or model-visible tool guidance.

## Verification

For docs-only work in this packet:

```text
rg -n "TODO|TBD" local/skills-invocation-work
rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/skills-invocation-work
git diff --check -- local/skills-invocation-work
```

