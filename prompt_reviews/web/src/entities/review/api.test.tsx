import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyFile, getCommitFileDetail, listActiveVersions, listVersions } from "./api";

describe("structured review api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists open versions through the structured versions endpoint", async () => {
    const fetchMock = mockJsonResponse({
      versions: [
        {
          id: "version-1",
          label: "Batch 07",
          status: "open",
          createdAt: 1,
          progress: {
            totalCommits: 2,
            reviewedCommits: 1,
            totalFiles: 3,
            reviewedFiles: 1,
            unresolvedComments: 0,
            pendingDecisions: 1,
            incompletePlans: 0,
            remainingWorkCount: 2,
          },
        },
      ],
    });

    await expect(listVersions()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/versions?status=open", expect.any(Object));
  });

  it("keeps reviewing and ready versions visible as active workbench versions", async () => {
    const fetchMock = mockJsonResponse({
      versions: [
        versionSummary("version-open", "open"),
        versionSummary("version-reviewing", "reviewing"),
        versionSummary("version-ready", "ready"),
        versionSummary("version-closed", "closed"),
        versionSummary("version-archived", "archived"),
      ],
    });

    await expect(listActiveVersions()).resolves.toEqual([
      expect.objectContaining({ id: "version-open" }),
      expect.objectContaining({ id: "version-reviewing" }),
      expect.objectContaining({ id: "version-ready" }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/api/versions?status=all", expect.any(Object));
  });

  it("reads flat commit file detail with structured diff blocks", async () => {
    mockJsonResponse({
      id: "file-1",
      commitId: "commit-1",
      path: "src/app.ts",
      changeType: "modified",
      status: "reviewing",
      primaryTagSlug: "prompt.contract",
      secondaryTagSlugs: [],
      diffBlocks: [
        {
          id: "block-1",
          commitFileId: "file-1",
          heading: "contract update",
          oldStartLine: 3,
          oldEndLine: 4,
          newStartLine: 3,
          newEndLine: 5,
          patch: "@@ -3,2 +3,3 @@\n-old\n+new",
          taggings: [],
          comments: [],
        },
      ],
      review: {
        taggings: [],
        comments: [],
        decisions: [],
        plans: [],
      },
    });

    const detail = await getCommitFileDetail("file-1");
    expect(detail.path).toBe("src/app.ts");
    expect(detail.diffBlocks[0]?.patch).toContain("@@");
  });

  it("sends classification as a structured command", async () => {
    const fetchMock = mockJsonResponse({
      scope: { type: "commit_file", commitFileId: "file-1" },
      taggings: [],
      summary: "Classified by reviewer",
      updatedBy: { type: "human", id: "local-user", displayName: "Human reviewer" },
      updatedAt: 7,
      riskLevel: "medium",
      confidence: "high",
    });

    await classifyFile("file-1", {
      primaryTagSlug: "prompt.contract",
      secondaryTagSlugs: ["prompt.workflow"],
      rationale: "Structured concern",
      riskLevel: "medium",
      confidence: "high",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/commit-files/file-1/classification",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          primaryTagSlug: "prompt.contract",
          secondaryTagSlugs: ["prompt.workflow"],
          rationale: "Structured concern",
          riskLevel: "medium",
          confidence: "high",
        }),
      }),
    );
  });
});

function mockJsonResponse(payload: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function versionSummary(id: string, status: "open" | "reviewing" | "ready" | "closed" | "archived") {
  return {
    id,
    label: id,
    status,
    createdAt: 1,
    progress: {
      totalCommits: 1,
      reviewedCommits: 0,
      totalFiles: 1,
      reviewedFiles: 0,
      unresolvedComments: 0,
      pendingDecisions: 0,
      incompletePlans: 0,
      remainingWorkCount: 0,
    },
  };
}
