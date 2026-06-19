export const reviewTestNow = "2026-06-17T12:00:00.000Z";

export const reviewTestActors = {
  human: { type: "human", id: "human-1", displayName: "Cullen" },
  agent: { type: "agent", id: "agent-1", displayName: "Codex" },
  system: { type: "system", id: "system-1", displayName: "Ingest" },
} as const;

export const reviewTestRange = {
  repositoryId: "openai/codex",
  baseRef: "local-main",
  targetRef: "upstream/main",
  baseSha: "1234567",
  targetSha: "abcdef1",
  label: "Upstream review",
} as const;

export const reviewTestConcernAreas = {
  primary: "tool-affordances",
  secondary: "permission-defaults",
  alternate: "hidden-context",
  followUp: "message-roles",
} as const;

export const reviewTestIds = {
  version: "version-1",
  commit: "commit-1",
  file: "file-1",
  diffBlock: "diff-1",
  agentReview: "agent-review-1",
  event: "event-1",
} as const;

export function reviewVersionFixture() {
  return {
    id: reviewTestIds.version,
    label: reviewTestRange.label,
    repositoryId: reviewTestRange.repositoryId,
    baseRef: reviewTestRange.baseRef,
    targetRef: reviewTestRange.targetRef,
    baseSha: reviewTestRange.baseSha,
    targetSha: reviewTestRange.targetSha,
    createdAt: reviewTestNow,
    updatedAt: null,
  };
}

export function reviewCommitFixture() {
  return {
    id: reviewTestIds.commit,
    versionId: reviewTestIds.version,
    sha: reviewTestRange.targetSha,
    position: 0,
    title: "Adjust tool prompts",
    message: null,
    authorName: "OpenAI",
    committedAt: reviewTestNow,
    reviewMark: "FLAG" as const,
    createdAt: reviewTestNow,
    updatedAt: null,
  };
}

export function reviewFileFixture() {
  return {
    id: reviewTestIds.file,
    commitId: reviewTestIds.commit,
    position: 0,
    path: "codex-rs/core/src/prompt.rs",
    oldPath: null,
    changeKind: "modified" as const,
    reviewMark: null,
    createdAt: reviewTestNow,
    updatedAt: null,
  };
}

export function diffBlockFixture() {
  return {
    id: reviewTestIds.diffBlock,
    fileId: reviewTestIds.file,
    position: 0,
    heading: "prompt",
    oldStartLine: 1,
    oldEndLine: 1,
    newStartLine: 1,
    newEndLine: 1,
    patch: "@@ -1 +1 @@\n-old\n+new",
  };
}

export function reviewVersionReadFixture() {
  return {
    ...reviewVersionFixture(),
    commitCount: 1,
    commits: [
      {
        ...reviewCommitFixture(),
        concernAreas: [reviewTestConcernAreas.primary],
        agentReviews: [],
        files: [
          {
            ...reviewFileFixture(),
            agentReviews: [],
            diffBlocks: [diffBlockFixture()],
          },
        ],
      },
    ],
  };
}

export function commitAgentReviewFixture() {
  return {
    id: reviewTestIds.agentReview,
    commitId: reviewTestIds.commit,
    reviewedMark: "MODIFY" as const,
    reviewedConcernAreas: [reviewTestConcernAreas.primary],
    notesMarkdown: "Agent reviewed the commit.",
    reviewer: reviewTestActors.agent,
    createdAt: reviewTestNow,
  };
}

export function fileAgentReviewFixture() {
  return {
    id: "agent-review-2",
    fileId: reviewTestIds.file,
    reviewedMark: "PASS" as const,
    notesMarkdown: null,
    reviewer: reviewTestActors.agent,
    createdAt: reviewTestNow,
  };
}
