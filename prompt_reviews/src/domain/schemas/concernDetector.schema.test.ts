import { describe, expect, it } from "vitest";
import {
  ConcernGraphEdgeSchema,
  ConcernGraphNodeSchema,
  ConcernMapEntrySchema,
  DetectorFindingSchema,
  DetectorFindingSummarySchema,
  DetectorRunSchema,
} from "./index.js";

describe("concern detector schemas", () => {
  it("accepts representative graph, run, finding, and summary shapes", () => {
    const node = {
      id: "cgn_1",
      concernSlug: "harness-prompts",
      nodeKey: "harness-prompts:file:codex-rs/core/src/client.rs",
      nodeKind: "file",
      path: "codex-rs/core/src/client.rs",
      sourceKind: "concern_map",
      isSeed: true,
      isKnownMissing: false,
      metadata: { source: "concern-map" },
      createdAt: 1,
      updatedAt: null,
    };
    const edge = {
      id: "cge_1",
      concernSlug: "harness-prompts",
      edgeKey: "harness-prompts:include-str:client-to-template",
      edgeKind: "include_str",
      fromNodeId: "cgn_1",
      toNodeId: "cgn_2",
      sourceKind: "ast_extractor",
      metadata: {},
      createdAt: 2,
      updatedAt: null,
    };
    const run = {
      id: "drun_1",
      versionId: "ver_1",
      repositoryId: "codex",
      runKind: "version_ingestion",
      status: "succeeded",
      concernMapVersion: 1,
      baseSha: "base",
      targetSha: "target",
      sourceRef: null,
      startedAt: 3,
      completedAt: 4,
      error: null,
      summary: { findings: 1 },
      createdAt: 3,
      updatedAt: null,
    };
    const finding = {
      id: "dfnd_1",
      runId: "drun_1",
      versionId: "ver_1",
      commitId: "cmt_1",
      commitFileId: "file_1",
      diffBlockId: null,
      graphNodeId: "cgn_1",
      graphNodeKey: node.nodeKey,
      findingKey: "cmt_1:file_1:harness-prompts",
      concernSlug: "harness-prompts",
      target: { type: "commit_file", commitFileId: "file_1" },
      path: "codex-rs/core/src/client.rs",
      side: "new",
      startLine: 10,
      endLine: 12,
      symbol: "build_responses_request",
      marker: null,
      evidenceKind: "symbol",
      title: "Harness prompt surface changed",
      summary: "Responses instructions builder changed in a mapped path.",
      evidence: [{ nodeKey: node.nodeKey, path: node.path }],
      createdAt: 5,
    };
    const summary = {
      concernSlug: "harness-prompts",
      targetType: "commit_file",
      targetId: "file_1",
      count: 1,
      evidenceSummaries: ["Responses instructions builder changed in a mapped path."],
    };

    expect(ConcernGraphNodeSchema.parse(node)).toEqual(node);
    expect(ConcernGraphEdgeSchema.parse(edge)).toEqual(edge);
    expect(DetectorRunSchema.parse(run)).toEqual(run);
    expect(DetectorFindingSchema.parse(finding)).toEqual(finding);
    expect(DetectorFindingSummarySchema.parse(summary)).toEqual(summary);
  });

  it("rejects loose or under-specified detector boundaries", () => {
    expect(
      ConcernGraphNodeSchema.safeParse({
        concernSlug: "harness-prompts",
        nodeKey: "missing-evidence",
        nodeKind: "file",
        sourceKind: "concern_map",
        isSeed: true,
        isKnownMissing: false,
        metadata: {},
      }).success,
    ).toBe(false);

    expect(
      ConcernMapEntrySchema.safeParse({
        slug: "harness-prompts",
        label: "Harness Prompts",
        behaviorDefinition: "Definition",
        seedPaths: [{ path: "codex-rs/core/src/client.rs", status: "present" }],
        seedGlobPatterns: [],
        seedSymbols: [],
        seedStringMarkers: [],
        seedTemplateMarkers: [],
        expansionEdgeTypes: ["calls"],
        falsePositiveExclusions: ["Exclude unrelated UI."],
        fixtureExpectations: [{ name: "fixture", description: "Fixture expectation.", required: true }],
      }).success,
    ).toBe(false);

    expect(
      DetectorFindingSchema.safeParse({
        runId: "drun_1",
        versionId: "ver_1",
        commitId: "cmt_1",
        commitFileId: "file_1",
        diffBlockId: null,
        graphNodeId: null,
        graphNodeKey: null,
        findingKey: "finding",
        concernSlug: "harness-prompts",
        target: { type: "commit_file", commitFileId: "file_1" },
        path: null,
        side: null,
        startLine: null,
        endLine: null,
        symbol: null,
        marker: null,
        evidenceKind: "path",
        title: "Finding",
        summary: "Summary",
        evidence: [],
        legacyReviewPath: "old-artifact",
      }).success,
    ).toBe(false);
  });
});
