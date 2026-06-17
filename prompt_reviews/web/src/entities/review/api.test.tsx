import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyFile, getCommitFileDetail, listActiveVersions, listCommitFiles, listVersionCommits, listVersions } from "./api";

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
          detectorFindings: [],
        },
      ],
      detectorFindingSummaries: [],
      detectorFindings: [],
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

  it("keeps detector findings available in review payloads without treating them as tags", async () => {
    mockJsonResponse({
      id: "file-1",
      commitId: "commit-1",
      path: "src/app.ts",
      changeType: "modified",
      status: "reviewing",
      primaryTagSlug: "prompt.contract",
      secondaryTagSlugs: [],
      detectorFindingSummaries: [detectorFindingSummary("commit_file", "file-1")],
      detectorFindings: [detectorFinding("commit_file", "file-1")],
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
          detectorFindings: [detectorFinding("diff_block", "block-1")],
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
    expect(detail.detectorFindingSummaries).toHaveLength(1);
    expect(detail.detectorFindings[0]?.concernSlug).toBe("harness-prompts");
    expect(detail.diffBlocks[0]?.detectorFindings[0]?.target).toEqual({ type: "diff_block", diffBlockId: "block-1" });
    expect(detail.review.taggings).toEqual([]);
  });

  it("parses paginated commit lists with canonical metadata", async () => {
    const fetchMock = mockJsonResponse(pagePayload([commitQueueItem("commit-1")], "next-page", 272));

    await expect(listVersionCommits("version-1", true, { cursor: "cursor-1", limit: 25 })).resolves.toMatchObject({
      data: [{ id: "commit-1" }],
      nextCursor: "next-page",
      returnedCount: 1,
      totalCount: 272,
      hasMore: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/versions/version-1/commits?remaining=true&cursor=cursor-1&limit=25",
      expect.any(Object),
    );
  });

  it("parses paginated commit-file lists with canonical metadata", async () => {
    const fetchMock = mockJsonResponse(pagePayload([commitFileQueueItem("file-1")], null, 1));

    await expect(listCommitFiles("commit-1", true, { cursor: "cursor-1", limit: 10 })).resolves.toMatchObject({
      data: [{ id: "file-1" }],
      nextCursor: null,
      returnedCount: 1,
      totalCount: 1,
      hasMore: false,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/commits/commit-1/files?remaining=true&cursor=cursor-1&limit=10",
      expect.any(Object),
    );
  });

  it("sends classification as a structured command", async () => {
    const fetchMock = mockJsonResponse({
      scope: { type: "commit_file", commitFileId: "file-1" },
      taggings: [],
      updatedBy: { type: "human", id: "local-user", displayName: "Human reviewer" },
      updatedAt: 7,
    });

    await classifyFile("file-1", {
      primaryTagSlug: "prompt.contract",
      secondaryTagSlugs: ["prompt.workflow"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/commit-files/file-1/classification",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          primaryTagSlug: "prompt.contract",
          secondaryTagSlugs: ["prompt.workflow"],
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

function commitQueueItem(id: string) {
  return {
    id,
    versionId: "version-1",
    sha: `sha-${id}`,
    title: id,
    status: "unreviewed",
    secondaryTagSlugs: [],
    fileCount: 1,
    detectorFindingSummaries: [],
  };
}

function commitFileQueueItem(id: string) {
  return {
    id,
    commitId: "commit-1",
    path: `src/${id}.ts`,
    changeType: "modified",
    status: "unreviewed",
    secondaryTagSlugs: [],
    detectorFindingSummaries: [],
  };
}

function detectorFindingSummary(targetType: "commit_file" | "diff_block", targetId: string) {
  return {
    concernSlug: "harness-prompts",
    targetType,
    targetId,
    count: 1,
    evidenceSummaries: ["Prompt wording changed"],
  };
}

function detectorFinding(targetType: "commit_file" | "diff_block", targetId: string) {
  return {
    id: `finding-${targetId}`,
    runId: "run-1",
    versionId: "version-1",
    commitId: "commit-1",
    commitFileId: "file-1",
    diffBlockId: targetType === "diff_block" ? targetId : null,
    graphNodeId: "node-1",
    graphNodeKey: "symbol:BASE_INSTRUCTIONS",
    findingKey: `finding-key-${targetId}`,
    concernSlug: "harness-prompts",
    target: targetType === "diff_block" ? { type: "diff_block", diffBlockId: targetId } : { type: "commit_file", commitFileId: targetId },
    path: "src/app.ts",
    side: "new",
    startLine: 3,
    endLine: 5,
    symbol: "BASE_INSTRUCTIONS",
    marker: "goal",
    evidenceKind: "diff_block",
    title: "Prompt wording changed",
    summary: "Prompt wording changed",
    evidence: [
      {
        nodeKey: "symbol:BASE_INSTRUCTIONS",
        path: "src/app.ts",
        symbol: "BASE_INSTRUCTIONS",
        marker: "goal",
      },
    ],
    createdAt: 1,
  };
}

function pagePayload<T>(data: T[], nextCursor: string | null, totalCount: number) {
  return {
    data,
    nextCursor,
    returnedCount: data.length,
    totalCount,
    hasMore: nextCursor !== null,
  };
}
