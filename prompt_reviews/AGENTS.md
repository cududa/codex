# Prompt Reviews Applet

This applet exists to help a human and an agent review prompt changes with the same care normally reserved for code changes.

The core use case is reviewing diffs of prompts between commits, especially changes that affect Codex behavior, agent persistence, tool affordances, hidden context, continuation behavior, collaboration mode, goal handling, permission defaults, and the human/agent cadence that emerges from those systems.

The goal is not merely to show files. The goal is to make prompt review conversational, anchored, and durable:

- Agents should be able to generate focused prompt review artifacts from commits or refs.
- Humans and agents should be able to comment on exact diff blocks or selected prompt text.
- Comments should remain tied to stable generated review files so the review can survive across sessions.
- The frontend should make the human review experience clear, calm, and capable enough for long-running upstream review work.
- The MCP surface should remain useful to agents, but the web UI should be built for a human who is inspecting subtle wording and behavioral consequences.

## Development Posture

Treat this as a real local review workbench, not a toy demo. The applet may grow to support broad review workflows around the Codex shipping cadence, so keep boundaries clear and avoid dumping new frontend code into a flat directory.

Frontend code should stay organized by concern:

- `web/src/app` for application bootstrap, routing, and providers.
- `web/src/features` for user workflows such as the review workspace.
- `web/src/entities` for domain models and API access.
- `web/src/shared` for reusable UI, API transport, and small utilities.

Backend code is currently flatter than ideal. Avoid making that worse. When backend changes are necessary, keep them small and prefer separating concerns when the shape of the change makes that natural.

## Product Intent

Prompt wording can create real agent failure modes even when the code change looks minor. This tool should help surface those risks before accepting upstream changes. Prioritize interfaces and data shapes that help reviewers ask:

- What changed in the prompt?
- Which model or harness behavior might this affect?
- Does this wording alter autonomy, persistence, permission posture, continuation, tool use, or user trust?
- Can a comment point to the exact phrase or diff block that matters?
- Can the review be resumed later without losing context?

The best version of this applet lets the human and agent stay in a shared review rhythm: precise when needed, lightweight when possible, and durable enough to support ongoing maintenance of a user-maintained Codex instance.
