---
name: task-alignment
description: Use when working in an existing repository where reading code may pull planning or implementation away from the user's requested work, especially tasks involving routes, schemas, database models, UI surfaces, MCP tools, architecture docs, or slice plans. Requires a visible Direction Lock checkpoint before execution.
metadata:
  short-description: Keep repo work aligned to user intent after code inspection
---

# Task Alignment

Existing repositories are persuasive. This skill keeps their suggestions in the right place: user intent names the work, authority docs constrain it, and existing code informs how to carry it out. After inspecting code, return to the request, name any code-shape temptation, lock the direction visibly, then execute that direction.

For deeper process detail, read the repo's task-alignment document when one exists, such as `docs/task-alignment.md`.

## Workflow

### 1. Intent Snapshot

Before reading implementation code, state what the user asked you to do. Capture the requested outcome, the expected artifact or implementation shape, and any explicit exclusions.

This preserves the work before the repo starts suggesting answers.

### 2. Authority Grounding

Read applicable `AGENTS.md` files and named authority docs. Use them to understand constraints, boundaries, terminology, and verification expectations.

Authority docs constrain the work. They do not replace the assignment.

### 3. Terrain Inspection

Read existing code to understand where the work belongs and how the repo is shaped. Look for relevant names, routes, schemas, services, tables, hooks, components, tools, and integration points.

Existing code is terrain, not mission.

### 4. Direction Lock

After code inspection, return to the original request and authority constraints. State the locked direction visibly before planning further, writing the final artifact, or editing files.

Use this checkpoint:

```markdown
## Direction Lock

- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:
```

The locked direction is the single decision point. Do not reopen the shape of the task after Direction Lock.

### 5. Execution

Carry out the locked direction. Ordinary implementation choices can still happen, but they stay inside the locked shape.

Do not treat a nearby endpoint, schema, table, UI surface, helper, or tool as permission to substitute a different task.

### 6. Pause And Report Conflict

Pause only when proceeding would require silently changing the task:

- two user instructions conflict
- an applicable `AGENTS.md` or named authority doc directly contradicts the requested shape
- required information is missing and guessing would change behavior or scope
- the locked direction is impossible as stated in the current repo

Use direct language: conflict, impossible as stated, scope-changing ambiguity, directly contradicted, or would silently substitute a different task.

Avoid anxiety framing such as unsafe, dangerous, risky, protect, least invasive, safer approach, or preserve current behavior unless the user explicitly scoped the task that way.

### 7. Verification

Check the result against the locked direction and the repo's required gates.

For docs-only work, report files changed, whether tests were not run, and any unresolved assumptions.

For code, schema, route, database, generated contract, or dependency changes, follow the repository's verification instructions.
