---
name: codex-review-orchestration
description: Use when coordinating an agentic review of upstream Codex commits through Review Dedeluger MCP resources or tools, especially when the queue is large, concern areas are mixed, or work may be delegated to reviewing agents. Requires a visible Orchestration Lock before assignment, execution, or recording review outcomes.
metadata:
  short-description: Coordinate focused Codex commit reviews without losing the review lens
---

# Codex Review Orchestration

Large review queues are persuasive in a different way than codebases are: they create pressure to skim, bulk-decide, or treat routing hints as conclusions. This skill keeps the review approachable by turning the queue into focused, evidence-based review units.

Map the queue, lock the lens, assign focused packets, integrate evidence, and keep uncertainty visible.

The orchestrator's job is not to personally review every line. The orchestrator preserves review intent across the queue, coordinates focused reviewers when useful, reconciles their findings, and leaves the human with a clear map of what passed, what remains flagged, and why.

Before using this skill, read the local Codex review orientation document when available, such as `local/codex_review/codex-review-orientation.md`. If it is not available, read the repository orientation document, such as `docs/mcp-workflows/codex-review-orientation.md`.

## Workflow

### 1. Review Intent Snapshot

Before inspecting the queue, state what the user asked you to oversee. Capture the review version or upstream range, whether the task is triage, full review, second pass, or synthesis, whether delegation is allowed, the expected output, and any explicit exclusions.

The request names the review. The queue does not.

### 2. Authority Grounding

Read the Codex review orientation and the canonical concern-area catalog available through docs or MCP resources. Use them to understand the behavioral review lens, concern-area meanings, review state semantics, note style, and approval boundaries.

Authority docs constrain the review. They do not decide individual commits.

### 3. Queue Reconnaissance

Use compact review-version and routing-card resources before focused packets. Inspect queue size, current marks, concern-area hints, path clusters, outliers by file count or line count, and existing agent-review or note counts.

Routing cards are for sizing and assignment. They are not evidence for final judgment.

### 4. Orchestration Lock

After queue reconnaissance, return to the user request and review orientation. State the locked orchestration visibly before assigning work, writing synthesis, or recording review outcomes.

Use this checkpoint:

```markdown
## Orchestration Lock

- Request:
- Review lens:
- Authority:
- Queue shape:
- Assignment strategy:
- Queue-shape temptation:
- Locked orchestration:
- Exclusions:
- Verification:
```

The locked orchestration is the single decision point for the review pass. Ordinary assignment and integration choices can still happen, but they stay inside the locked shape.

Useful queue-shape temptations include bulk-passing generated-looking commits, treating concern hints as judgment, widening into general implementation review, or avoiding focused packets because a commit looks large.

### 5. Assignment Planning

Break the queue into focused review units. Prefer assignment by behavioral path over raw size:

- prompt and instruction changes
- message role or hidden-context changes
- goal continuation and compaction paths
- tool schema, permission, and MCP affordance changes
- generated schema churn needing source-behavior confirmation
- documentation or agent guidance changes

Each assignment should include the commit id or small commit set, the required review lens, packet resources to inspect, existing notes or reviews to consider, expected output shape, and the rule that uncertainty must stay visible.

When delegating, give reviewers a bounded prompt:

```markdown
Review only the assigned commit(s) under the Codex review lens. Use routing cards only for orientation and focused packets for judgment. Record whether each commit should PASS or FLAG, which concern areas apply, and the evidence for the note. Do not use human approval. Leave uncertainty visible.
```

### 6. Review Integration

When reviewer outputs return, reconcile the evidence before recording outcomes. Check whether the reviewer inspected focused packets, explained what changed and why it matters, used concern areas as reasons rather than blame, justified `none-apply`, tied `FLAG` to a specific remaining question, and avoided turning uncertainty into certainty.

Ask for a second pass when evidence is thin, the review lens was missed, or the uncertainty is too vague to help the human.

### 7. Recording Discipline

Record review outcomes only when they match the evidence.

Use `PASS` when the commit has been reviewed and no follow-up is needed. Use `PASS` with concern areas when the behavior is relevant but understood. Use `FLAG` when human attention, another pass, or unresolved uncertainty remains. Use `none-apply` only after checking that no canonical concern area applies.

Do not approve commits unless the active workflow explicitly asks for human approval.

### 8. Synthesis

End with a queue-level synthesis. Report what was reviewed, what passed cleanly, what passed with concern relevance, what remains flagged and why, repeated patterns across commits, second-pass recommendations, and any verification or recording gaps.

The summary should help the human decide what to inspect next without rereading the whole queue.

### 9. Pause And Report Conflict

Pause only when proceeding would require silently changing the review:

- two user instructions conflict
- an applicable authority doc directly contradicts the requested review shape
- required information is missing and guessing would change review scope or recorded outcomes
- the locked orchestration is impossible as stated in the current queue

Use direct language: conflict, impossible as stated, scope-changing ambiguity, directly contradicted, or would silently substitute a different review.

Avoid anxiety framing such as unsafe, dangerous, risky, protect, least invasive, safer approach, or preserve current behavior unless the user explicitly scoped the review that way.

### 10. Verification

Check the result against the Orchestration Lock and the repo's required gates.

For review-only work, report which commits or queue segments were reviewed, which MCP outcomes were recorded, whether tests were not run, and any unresolved assumptions.

For changes to docs, skills, code, schemas, routes, generated contracts, or dependencies, follow the repository's verification instructions.
