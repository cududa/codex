# Concern Detector Notes

These notes preserve the architecture behind the prompt-review concern detector
without presenting it as an implementation guide.

The detector is review evidence for `prompt_reviews`. Its job is to answer:

> Did this upstream change touch code or prompt text that can materially alter
> Cullen's Codex working cadence?

It should stay grounded in concrete source surfaces: files, symbols, templates,
markers, enums, call edges, registration edges, config fields, wire types,
tests, and snapshots. It is not a generic classifier and it does not replace
human review decisions.

## Files

- `concern-surfaces.md` lists the durable concern areas and the source graph
  surfaces that make each one review-relevant.
- `architecture.md` describes the detector's conceptual model, graph behavior,
  finding semantics, read surfaces, and guardrails.

## How To Use These Notes

Use the concern surface map before reviewing upstream changes that touch Codex
prompts, roles, hidden context, goals, compaction, tools, or permissions.

For each commit or file, look for overlap with the seeded paths, symbols,
markers, and expansion cues. Treat a hit as evidence that the change deserves
closer review; do not treat it as an automatic decision.

When these notes drift from the source tree, prefer updating the map with the
smallest accurate source-surface change. Avoid turning this directory back into
a batch plan, acceptance checklist, or one-off implementation recipe.
