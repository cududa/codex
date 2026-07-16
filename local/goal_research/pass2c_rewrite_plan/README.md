# Pass 2C Rewrite Planning Packets

This directory holds bounded Pass 2C planning packets. It is not the successor
authority workspace and it is not a source-slice execution workspace.

## Packet Rules

- One packet owns one closeable planning decision.
- Prefer 60-120 lines per packet.
- Split before 180 lines unless the extra length is a small table the packet
  explicitly owns.
- Split immediately when a packet starts mixing target decisions, source-slice
  decisions, workflow templates, route policy, repeated-authority policy, audit
  policy, or cutover gates.
- A packet closes only after the required source docs for that decision have
  been read directly enough to justify the decision from first principles.
- Trace rows, concept rows, Pass 2B keys, Pass 2B.5 batches, route indexes, and
  search results are navigation aids. They are not substitutes for source
  reading.
- Use implementation-route material only as a verification input where the
  planning decision depends on implementation-shaped sequencing.
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
| `packet-00-planning-boundary-and-packet-rules.md` | What may this planning scaffold create, and how small must packets stay? | none | Stub |
| `packet-01-draft-workspace-and-naming.md` | Where will later draft docs, slice records, and audit records live? | 00 | Stub |
| `packet-02-successor-target-inventory.md` | What target keys exist, and what draft document is proposed for each? | 00, 01 | Stub |
| `packet-03-target-owner-boundaries.md` | Which target owns each major rule family, and where are local reminders allowed? | 02 | Stub |
| `packet-04-target-source-feed-map.md` | Which source docs most likely feed each target, without deciding slice order? | 02, 03 | Stub |
| `packet-05-source-slice-unit-rules.md` | What counts as one executable source slice? | 00 | Stub |
| `packet-06-source-doc-split-review.md` | Which source docs need whole-doc slices versus heading-range slices? | 05 | Stub |
| `packet-07-source-dependency-order-rules.md` | What dependency principles should order slices? | 03, 05, 06 | Stub |
| `packet-08-ordered-slice-table.md` | What ordered source-slice table follows from the closed prerequisite packets? | 04, 06, 07 | Blocked until prerequisites close |
| `packet-09-route-verification-question-families.md` | Which planning decisions require implementation-route verification? | 03, 07 | Stub |
| `packet-10-slice-workflow-and-record-shape.md` | What workflow and small record shape prove one slice closed? | 08, 09 | Stub |
| `packet-11-repeated-authority-compression-gates.md` | What gates prevent over-compressing repeated authority? | 03, 10 | Stub |
| `packet-12-fidelity-audit-categories.md` | What semantic-loss categories must each slice audit? | 10, 11 | Stub |
| `packet-13-cutover-gates.md` | What must be true before successor docs replace the source docs? | 10, 11, 12 | Stub |

## Closeability Gate

Before marking a packet closed, confirm:

- the packet answers only its named question,
- all required grounding named in that packet was read directly,
- any unresolved question is explicit and assigned to a later packet or user
  decision,
- no source rewrite execution has started, and
- no successor draft or source-slice record was created.

## Output Boundary

This directory should eventually answer how Pass 2C will execute. It should
not contain rewritten authority body content. Future successor drafts and slice
records belong in a separate execution workspace chosen by Packet 01.
