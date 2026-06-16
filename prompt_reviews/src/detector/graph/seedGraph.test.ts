import { describe, expect, it } from "vitest";
import { buildConcernGraph } from "./seedGraph.js";
import type { ExtractedEdge, ExtractedNode, ExtractionOutput, TextScanHit } from "../extraction/types.js";

const goalsPath = "codex-rs/core/src/goals.rs";

describe("concern graph builder", () => {
  it("builds concern-map seed nodes with deterministic keys and source metadata", () => {
    const graph = buildConcernGraph({ detectorVersion: 7, sourceRef: "seed-test" });
    const goalFile = graph.nodes.find(
      (node) => node.concernSlug === "goal-continuation" && node.nodeKind === "file" && node.path === goalsPath,
    );
    const goalMarker = graph.nodes.find(
      (node) =>
        node.concernSlug === "goal-continuation" &&
        node.nodeKind === "string_marker" &&
        node.marker === "Continue working toward the active thread goal.",
    );

    expect(goalFile).toMatchObject({
      sourceKind: "concern_map",
      isSeed: true,
      isKnownMissing: false,
      metadata: {
        detectorVersion: 7,
        sourceRef: "seed-test",
        discovery: "concern_map_seed",
        seedType: "path",
      },
    });
    expect(goalMarker).toMatchObject({
      sourceKind: "concern_map",
      isSeed: true,
      metadata: { seedType: "marker" },
    });
    expect(graph.nodes).toEqual([...graph.nodes].sort((left, right) => left.concernSlug.localeCompare(right.concernSlug) || left.nodeKind.localeCompare(right.nodeKind) || left.nodeKey.localeCompare(right.nodeKey)));
  });

  it("adds direct extractor and scanner matches without requiring downstream detector code", () => {
    const graph = buildConcernGraph({
      detectorVersion: 7,
      sourceRef: "abc123",
      sourceRunId: "drun_test",
      extraction: {
        nodes: [node("seed-symbol", "rust_item", { symbol: "GoalRuntimeState", startLine: 10, endLine: 18 })],
        edges: [],
        scanHits: [
          scanHit("goal-template", "prompt_marker", "Continue working toward the active thread goal.", [
            "goal-continuation",
          ]),
        ],
      },
    });

    const symbolNode = graph.nodes.find((candidate) => candidate.symbol === "GoalRuntimeState");
    const markerNode = graph.nodes.find(
      (candidate) =>
        candidate.marker === "Continue working toward the active thread goal." &&
        candidate.sourceKind === "text_scanner",
    );

    expect(symbolNode).toMatchObject({
      concernSlug: "goal-continuation",
      nodeKind: "rust_symbol",
      sourceKind: "ast_extractor",
      sourceRef: "abc123",
      isSeed: true,
      metadata: {
        sourceRunId: "drun_test",
        discovery: "direct_extraction_match",
        matchedBy: "symbol",
        extractionNodeKey: "seed-symbol",
      },
    });
    expect(markerNode).toMatchObject({
      concernSlug: "goal-continuation",
      nodeKind: "template_marker",
      path: "codex-rs/core/templates/goals/continuation.md",
      sourceKind: "text_scanner",
      isSeed: true,
      metadata: {
        discovery: "direct_text_scan_match",
        matchedBy: "scan_hit",
        hitKey: "goal-template",
      },
    });
  });

  it("expands one hop through concern-allowed edge kinds and records parent and edge reasons", () => {
    const graph = buildConcernGraph({ detectorVersion: 7, sourceRef: "commit-a", extraction: expansionFixture() });
    const seed = graph.nodes.find((candidate) => candidate.symbol === "GoalRuntimeState");
    const helper = graph.nodes.find((candidate) => candidate.symbol === "prepare_goal_summary");
    const edge = graph.edges.find((candidate) => candidate.edgeKind === "calls");

    expect(seed).toBeDefined();
    expect(helper).toMatchObject({
      concernSlug: "goal-continuation",
      isSeed: false,
      metadata: {
        discovery: "bounded_expansion",
        parentNodeKey: seed?.nodeKey,
        seedNodeKey: seed?.nodeKey,
        expansionDepth: 1,
        edgeKind: "calls",
        extractionEdgeKey: "edge-seed-helper",
      },
    });
    expect(edge).toMatchObject({
      concernSlug: "goal-continuation",
      fromNodeKey: seed?.nodeKey,
      toNodeKey: helper?.nodeKey,
      sourceKind: "graph_builder",
      sourceRef: "commit-a",
      metadata: {
        discovery: "bounded_expansion_edge",
        parentNodeKey: seed?.nodeKey,
        seedNodeKey: seed?.nodeKey,
        expansionDepth: 1,
        extractionEdgeKind: "calls",
      },
    });
    expect(edge?.metadata.edgeReason).toEqual(expect.stringContaining("calls this extracted symbol"));
  });

  it("does not expand through disallowed edges or past the configured bounded depth", () => {
    const graph = buildConcernGraph({ detectorVersion: 7, sourceRef: "bounded", extraction: expansionFixture() });

    expect(graph.nodes.some((candidate) => candidate.symbol === "REGISTERED_GOALS")).toBe(false);
    expect(graph.nodes.some((candidate) => candidate.symbol === "deep_goal_helper")).toBe(false);
    expect(graph.edges.some((candidate) => candidate.edgeKind === "registers")).toBe(false);
  });

  it("produces stable output across reruns with reordered extraction input", () => {
    const first = buildConcernGraph({ detectorVersion: 7, sourceRef: "stable", extraction: expansionFixture() });
    const fixture = expansionFixture();
    const second = buildConcernGraph({
      detectorVersion: 7,
      sourceRef: "stable",
      extraction: {
        nodes: [...fixture.nodes].reverse(),
        edges: [...fixture.edges].reverse(),
        scanHits: [...fixture.scanHits].reverse(),
      },
    });

    expect(second).toEqual(first);
    expect(first).toEqual(JSON.parse(JSON.stringify(first)));
  });
});

function expansionFixture(): ExtractionOutput {
  return {
    nodes: [
      node("seed-symbol", "rust_item", { symbol: "GoalRuntimeState", startLine: 10, endLine: 18 }),
      node("helper-symbol", "rust_function", { symbol: "prepare_goal_summary", startLine: 22, endLine: 30 }),
      node("deep-symbol", "rust_function", { symbol: "deep_goal_helper", startLine: 40, endLine: 44 }),
      node("registration-symbol", "rust_registration_array", { symbol: "REGISTERED_GOALS", startLine: 50, endLine: 55 }),
    ],
    edges: [
      edge("edge-seed-helper", "calls", "seed-symbol", "helper-symbol", { symbol: "prepare_goal_summary" }),
      edge("edge-helper-deep", "calls", "helper-symbol", "deep-symbol", { symbol: "deep_goal_helper" }),
      edge("edge-seed-registration", "registration", "seed-symbol", "registration-symbol", {
        symbol: "REGISTERED_GOALS",
      }),
    ],
    scanHits: [],
  };
}

function node(
  nodeKey: string,
  nodeKind: ExtractedNode["nodeKind"],
  values: Pick<ExtractedNode, "symbol" | "startLine" | "endLine">,
): ExtractedNode {
  return {
    path: goalsPath,
    nodeKind,
    nodeKey,
    symbol: values.symbol,
    startByte: values.startLine * 10,
    endByte: values.endLine * 10,
    startLine: values.startLine,
    endLine: values.endLine,
  };
}

function edge(
  edgeKey: string,
  edgeKind: ExtractedEdge["edgeKind"],
  fromNodeKey: string,
  toNodeKey: string,
  values: Pick<ExtractedEdge, "symbol">,
): ExtractedEdge {
  return {
    path: goalsPath,
    edgeKind,
    edgeKey,
    fromNodeKey,
    toNodeKey,
    symbol: values.symbol,
    startByte: 1,
    endByte: 2,
    startLine: 1,
    endLine: 1,
  };
}

function scanHit(hitKey: string, hitKind: TextScanHit["hitKind"], marker: string, concernSlugs: TextScanHit["concernSlugs"]): TextScanHit {
  return {
    path: "codex-rs/core/templates/goals/continuation.md",
    hitKind,
    hitKey,
    marker,
    concernSlugs,
    startByte: 1,
    endByte: 2,
    startLine: 1,
    endLine: 1,
  };
}
