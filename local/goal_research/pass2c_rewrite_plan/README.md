# Pass 2C Rewrite Planning Packets

This directory holds bounded Pass 2C planning packets. It is not the successor
authority workspace and it is not a source-slice execution workspace.

Status: all planning packets are closed. Treat this directory as the reference
scaffold for Pass 2C execution, not as the next place to add planning packets
by default. Start from `PASSFORWARD.md`, execute Packet 08 rows as the queue,
and apply Packets 09-13 as the governing execution and cutover checks.

## Packet Rules

- One packet owns one closeable planning decision. When that packet is active
  and unblocked, close that decision rather than assigning hard or dense parts
  to later work.
- Prefer 60-120 lines per packet.
- Split before 180 lines unless the extra length is a small table the packet
  explicitly owns. This is sizing guidance, not a hard cap; use the lines
  needed to answer one owned decision clearly.
- Split immediately when a packet starts mixing target decisions, source-slice
  decisions, workflow templates, route policy, repeated-authority policy, audit
  policy, or cutover gates. Splitting means creating smaller closeable
  decision packets, not avoiding the decision the active packet owns.
- A packet closes only after the required source docs for that decision have
  been read directly enough to justify the decision from first principles.
- Parent/index packets may create child stubs without filling decisions because
  their owned decision is the split scaffold. Child decision packets should
  make their assigned disposition unless a real split correction is needed.
- Trace rows, concept rows, Pass 2B keys, Pass 2B.5 batches, route indexes, and
  search results are navigation aids. They are not substitutes for source
  reading.
- Use implementation-route material only as a verification input where the
  planning decision depends on implementation-shaped sequencing.
- Carry a question forward only when direct grounding reveals a real conflict,
  missing prerequisite, or user decision. Do not mark a question unresolved
  merely because the answer is lengthy, cross-cutting, or inconvenient.
- Do not create successor authority docs from this directory.
- Do not create source-slice execution records from this directory.
- Do not rename, rehome, archive, or delete current source docs from this
  directory.

## Required Packet Sections

Use this shape unless a packet explains why it needs a narrower shape:

- Purpose
- Scope
- Required Grounding
- Decisions To Make
- Output Expected
- Closure Criteria
- Non-Goals
- Status

## Packet Status

| Packet | Planning question | Prerequisites | Status |
| --- | --- | --- | --- |
| `packet-00-planning-boundary-and-packet-rules.md` | What may this planning scaffold create, and how small must packets stay? | none | Closed |
| `packet-01-draft-workspace-and-naming.md` | Where will later draft docs, slice records, and audit records live? | 00 | Closed |
| `packet-02-successor-target-inventory.md` | What target keys exist, and what draft document is proposed for each? | 00, 01 | Closed |
| `packet-03-target-owner-boundaries.md` | Which target owns each major rule family, and where are local reminders allowed? | 02 | Closed |
| `packet-04-target-source-feed-map.md` | Which source docs most likely feed each target, without deciding slice order? | 02, 03 | Closed |
| `packet-05-source-slice-unit-rules.md` | What counts as one executable source slice? | 00 | Closed |
| `packet-06-source-doc-split-review.md` | How is source-doc split review divided into closeable source-family batches? | 05 | Closed as parent/index |
| `packet-06a-spine-source-split-review.md` | Which authority spine docs need whole-doc slices versus heading-range slices? | 06 | Closed |
| `packet-06b-core-seam-source-split-review.md` | How is core seam source-doc split review divided into closeable per-doc packets? | 06 | Closed as parent/index |
| `packet-06b1-durable-cadence-state-split-review.md` | Does the durable state source doc need whole-doc or heading-range slices? | 06b | Closed |
| `packet-06b2-final-request-input-split-review.md` | Does the final request-input source doc need whole-doc or heading-range slices? | 06b | Closed |
| `packet-06b3-model-visible-history-key-split-review.md` | Does the history-key source doc need whole-doc or heading-range slices? | 06b | Closed |
| `packet-06b4-recorded-request-evidence-split-review.md` | Does the recorded-evidence source doc need whole-doc or heading-range slices? | 06b | Closed |
| `packet-06b5-core-seam-split-rollup.md` | What consolidated core seam split disposition follows from the 06b child reviews? | 06b1, 06b2, 06b3, 06b4 | Closed |
| `packet-06c-support-and-demolition-source-split-review.md` | How is support and demolition source-doc split review divided into closeable per-doc packets? | 06 | Closed as parent/index |
| `packet-06c1-repair-classifier-split-review.md` | Does the repair/classifier source doc need whole-doc or heading-range slices? | 06c | Closed |
| `packet-06c2-extension-ownership-split-review.md` | Does the extension ownership source doc need whole-doc or heading-range slices? | 06c | Closed |
| `packet-06c3-fake-shim-removal-split-review.md` | Does the fake-shim removal source doc need whole-doc or heading-range slices? | 06c | Closed |
| `packet-06c4-support-demolition-split-rollup.md` | What consolidated support/demolition split disposition follows from the 06c child reviews? | 06c1, 06c2, 06c3 | Closed |
| `packet-06d-test-nav-readiness-source-split-review.md` | How is test, readiness, navigation, operations, glossary, and exclusion review divided into closeable packets? | 06 | Closed as parent/index |
| `packet-06d1-test-deletion-map-split-review.md` | Does the test deletion map source doc need whole-doc or heading-range slices? | 06d | Closed |
| `packet-06d2-open-design-readiness-split-review.md` | Does the open design deliverables source doc need whole-doc or heading-range slices? | 06d | Closed |
| `packet-06d3-agents-operations-split-review.md` | Does AGENTS.md need whole-doc or heading-range slices? | 06d | Closed |
| `packet-06d4-readme-navigation-split-review.md` | Does README.md need whole-doc or heading-range slices? | 06d | Closed |
| `packet-06d5-context-glossary-split-review.md` | Does CONTEXT.md need whole-doc or heading-range slices? | 06d | Closed |
| `packet-06d6-exclusion-candidates-review.md` | Which local goal-research docs are excluded from source-slice execution? | 06d | Closed |
| `packet-06d7-test-nav-readiness-split-rollup.md` | What consolidated 06d disposition follows from the 06d child reviews? | 06d1-06d6 | Closed |
| `packet-06e-split-review-rollup.md` | What consolidated source-doc split disposition follows from the child reviews? | 06a, 06b5, 06c4, 06d7 | Closed |
| `packet-07-source-dependency-order-rules.md` | What dependency principles should order slices? | 03, 05, 06e | Closed |
| `packet-08-ordered-slice-table.md` | What ordered source-slice table follows from the closed prerequisite packets? | 04, 06e, 07 | Closed |
| `packet-09-route-verification-question-families.md` | Which planning decisions require implementation-route verification? | 03, 07, 08 | Closed |
| `packet-10-slice-workflow-and-record-shape.md` | What workflow and small record shape prove one slice closed? | 08, 09 | Closed |
| `packet-11-repeated-authority-compression-gates.md` | What gates prevent over-compressing repeated authority? | 03, 10 | Closed |
| `packet-12-fidelity-audit-categories.md` | What semantic-loss categories must each slice audit? | 10, 11 | Closed |
| `packet-13-cutover-gates.md` | What must be true before successor docs replace the source docs? | 10, 11, 12 | Closed |

## Closeability Gate

Before marking a packet closed, confirm:

- the packet gives a concrete answer to its named question, or explicitly
  reclassifies itself as a parent/index because the named question is too broad,
- the packet answers only its named question,
- all required grounding named in that packet was read directly,
- any unresolved question is explicit and assigned to a later packet or user
  decision for a concrete reason,
- the packet does not defer work it owns merely to keep the file short,
- no source rewrite execution has started, and
- no successor draft or source-slice record was created.

## Output Boundary

This directory should eventually answer how Pass 2C will execute. It should
not contain rewritten authority body content. Future successor drafts and slice
records belong in a separate execution workspace chosen by Packet 01. This
artifact boundary does not forbid concrete planning decisions inside active
packets.
