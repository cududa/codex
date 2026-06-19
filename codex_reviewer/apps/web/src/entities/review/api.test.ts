import { describe, expect, it, vi, afterEach } from "vitest";
import {
  recordCommitAgentReview,
  recordFileAgentReview,
  setCommitConcernAreas,
  setCommitReviewMark,
  setFileReviewMark,
} from "./api";

describe("review API writes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the commit review mark route with an actor", async () => {
    const fetch = mockFetch();

    await setCommitReviewMark({ commitId: "commit-1", reviewMark: "PASS" });

    expect(fetch).toHaveBeenCalledWith("/api/review/commits/commit-1/review-mark", {
      method: "PATCH",
      body: JSON.stringify({
        actor: { type: "human", id: "local-human", displayName: "Local Human" },
        reviewMark: "PASS",
      }),
      headers: { "content-type": "application/json" },
    });
  });

  it("calls the file review mark route with nullable file marks", async () => {
    const fetch = mockFetch();

    await setFileReviewMark({ fileId: "file-1", reviewMark: null });

    expect(fetch).toHaveBeenCalledWith("/api/review/files/file-1/review-mark", {
      method: "PATCH",
      body: JSON.stringify({
        actor: { type: "human", id: "local-human", displayName: "Local Human" },
        reviewMark: null,
      }),
      headers: { "content-type": "application/json" },
    });
  });

  it("calls the commit concern-area route with ordered selections", async () => {
    const fetch = mockFetch();

    await setCommitConcernAreas({
      commitId: "commit-1",
      concernAreas: ["tool-affordances", "hidden-context"],
    });

    expect(fetch).toHaveBeenCalledWith("/api/review/commits/commit-1/concern-areas", {
      method: "PUT",
      body: JSON.stringify({
        actor: { type: "human", id: "local-human", displayName: "Local Human" },
        concernAreas: ["tool-affordances", "hidden-context"],
      }),
      headers: { "content-type": "application/json" },
    });
  });

  it("calls the commit agent review evidence route with an agent actor", async () => {
    const fetch = mockFetch();

    await recordCommitAgentReview({
      commitId: "commit-1",
      reviewedMark: "MODIFY",
      reviewedConcernAreas: ["tool-affordances", "hidden-context"],
      notesMarkdown: "The mark should remain challenged.",
    });

    expect(fetch).toHaveBeenCalledWith("/api/review/commits/commit-1/agent-reviews", {
      method: "POST",
      body: JSON.stringify({
        actor: { type: "agent", id: "local-agent", displayName: "Local Agent" },
        reviewedMark: "MODIFY",
        reviewedConcernAreas: ["tool-affordances", "hidden-context"],
        notesMarkdown: "The mark should remain challenged.",
      }),
      headers: { "content-type": "application/json" },
    });
  });

  it("calls the file agent review evidence route without concern areas", async () => {
    const fetch = mockFetch();

    await recordFileAgentReview({
      fileId: "file-1",
      reviewedMark: "PASS",
      notesMarkdown: null,
    });

    expect(fetch).toHaveBeenCalledWith("/api/review/files/file-1/agent-reviews", {
      method: "POST",
      body: JSON.stringify({
        actor: { type: "agent", id: "local-agent", displayName: "Local Agent" },
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
      headers: { "content-type": "application/json" },
    });
  });
});

function mockFetch() {
  const fetch = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          version: validVersion(),
        }),
        { status: 200 },
      ),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function validVersion() {
  return {
    id: "version-1",
    label: "Upstream review",
    repositoryId: "openai/codex",
    baseRef: "local-main",
    targetRef: "upstream/main",
    baseSha: "1234567",
    targetSha: "abcdef1",
    createdAt: "2026-06-17T12:00:00.000Z",
    updatedAt: null,
    commitCount: 1,
    commits: [
      {
        id: "commit-1",
        versionId: "version-1",
        sha: "abcdef1",
        position: 0,
        title: "Adjust tool prompt",
        message: null,
        authorName: "OpenAI",
        committedAt: null,
        reviewMark: "PASS",
        concernAreas: ["tool-affordances"],
        createdAt: "2026-06-17T12:00:00.000Z",
        updatedAt: null,
        agentReviews: [],
        files: [
          {
            id: "file-1",
            commitId: "commit-1",
            position: 0,
            path: "codex-rs/core/src/prompt.rs",
            oldPath: null,
            changeKind: "modified",
            reviewMark: null,
            createdAt: "2026-06-17T12:00:00.000Z",
            updatedAt: null,
            agentReviews: [],
            diffBlocks: [],
          },
        ],
      },
    ],
  };
}
