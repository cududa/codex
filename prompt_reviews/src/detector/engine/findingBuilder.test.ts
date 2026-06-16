import { describe, expect, it } from "vitest";
import { buildDetectorFindings } from "./findingBuilder.js";
import type { DetectorCommitInput } from "./types.js";
import type { ConcernGraphBuildNode, ConcernGraphBuildResult } from "../graph/index.js";

const goalsPath = "codex-rs/core/src/goals.rs";
const toolPath = "codex-rs/core/src/tools/registry.rs";

describe("detector finding builder", () => {
  it("emits a high-confidence diff block finding when changed lines overlap a seeded node", () => {
    const findings = buildDetectorFindings({
      runId: "drun_overlap_seed",
      graph: graph([node("seed-goal", { isSeed: true, path: goalsPath, symbol: "GoalRuntimeState", startLine: 10 })]),
      commits: [commit("cmt_1", [file("cf_1", goalsPath, block("db_1", "@@ -10,1 +10,1 @@\n-old\n+new"))])],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      runId: "drun_overlap_seed",
      versionId: "ver_1",
      commitId: "cmt_1",
      commitFileId: "cf_1",
      diffBlockId: "db_1",
      graphNodeKey: "seed-goal",
      concernSlug: "goal-continuation",
      targetType: "diff_block",
      targetId: "db_1",
      path: goalsPath,
      side: "new",
      startLine: 10,
      endLine: 10,
      symbol: "GoalRuntimeState",
      evidenceKind: "diff_block",
      riskLevel: "high",
      confidence: "high",
    });
  });

  it("emits medium confidence when changed lines overlap an expanded node", () => {
    const findings = buildDetectorFindings({
      runId: "drun_overlap_expanded",
      graph: graph([node("expanded-helper", { isSeed: false, path: goalsPath, symbol: "prepare_goal_summary", startLine: 30 })]),
      commits: [commit("cmt_1", [file("cf_1", goalsPath, block("db_1", "@@ -30,1 +30,1 @@\n-old\n+new"))])],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      targetType: "diff_block",
      targetId: "db_1",
      graphNodeKey: "expanded-helper",
      side: "new",
      startLine: 30,
      endLine: 30,
      riskLevel: "medium",
      confidence: "medium",
    });
  });

  it("emits a low-confidence commit-file finding for path-only fallback", () => {
    const findings = buildDetectorFindings({
      runId: "drun_path_only",
      graph: graph([node("path-seed", { isSeed: true, path: toolPath })]),
      commits: [commit("cmt_1", [file("cf_1", toolPath, block("db_1", "@@ -4,1 +4,1 @@\n-old\n+new"))])],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      commitFileId: "cf_1",
      diffBlockId: null,
      targetType: "commit_file",
      targetId: "cf_1",
      path: toolPath,
      side: null,
      startLine: null,
      endLine: null,
      evidenceKind: "path",
      riskLevel: "low",
      confidence: "low",
    });
  });

  it("does not emit findings for nonmatching paths", () => {
    const findings = buildDetectorFindings({
      runId: "drun_no_match",
      graph: graph([node("seed-goal", { isSeed: true, path: goalsPath, symbol: "GoalRuntimeState", startLine: 10 })]),
      commits: [commit("cmt_1", [file("cf_1", toolPath, block("db_1", "@@ -10,1 +10,1 @@\n-old\n+new"))])],
    });

    expect(findings).toEqual([]);
  });

  it("returns stable output when graph and commit inputs are reordered", () => {
    const graphNodes = [
      node("seed-goal", { isSeed: true, path: goalsPath, symbol: "GoalRuntimeState", startLine: 10 }),
      node("expanded-helper", { isSeed: false, path: goalsPath, symbol: "prepare_goal_summary", startLine: 30 }),
      node("path-seed", { isSeed: true, path: toolPath }),
    ];
    const commits = [
      commit("cmt_b", [file("cf_b", toolPath, block("db_b", "@@ -4,1 +4,1 @@\n-old\n+new"))]),
      commit("cmt_a", [
        file("cf_a", goalsPath, block("db_a1", "@@ -10,1 +10,1 @@\n-old\n+new")),
        file("cf_c", goalsPath, block("db_a2", "@@ -30,1 +30,1 @@\n-old\n+new")),
      ]),
    ];

    const first = buildDetectorFindings({ runId: "drun_stable", graph: graph(graphNodes), commits });
    const second = buildDetectorFindings({
      runId: "drun_stable",
      graph: graph([...graphNodes].reverse()),
      commits: commits.map((entry) => ({ ...entry, files: [...entry.files].reverse() })).reverse(),
    });

    expect(second).toEqual(first);
    expect(first.map((finding) => finding.findingKey)).toEqual([...first.map((finding) => finding.findingKey)].sort());
  });
});

function graph(nodes: ConcernGraphBuildNode[]): ConcernGraphBuildResult {
  return { nodes, edges: [] };
}

function node(
  nodeKey: string,
  values: {
    isSeed: boolean;
    path: string;
    symbol?: string;
    marker?: string;
    startLine?: number;
  },
): ConcernGraphBuildNode {
  const range = values.startLine === undefined ? undefined : { startByte: 1, endByte: 2, startLine: values.startLine, endLine: values.startLine };
  return {
    concernSlug: "goal-continuation",
    nodeKey,
    nodeKind: values.marker === undefined ? "rust_symbol" : "string_marker",
    path: values.path,
    symbol: values.symbol,
    marker: values.marker,
    sourceKind: values.isSeed ? "ast_extractor" : "graph_builder",
    isSeed: values.isSeed,
    isKnownMissing: false,
    metadata: range === undefined ? {} : { range },
  };
}

function commit(commitId: string, files: DetectorCommitInput["files"]): DetectorCommitInput {
  return { commitId, versionId: "ver_1", files };
}

function file(commitFileId: string, path: string, ...diffBlocks: DetectorCommitInput["files"][number]["diffBlocks"]): DetectorCommitInput["files"][number] {
  return { commitFileId, oldPath: null, newPath: path, diffBlocks };
}

function block(id: string, patch: string): DetectorCommitInput["files"][number]["diffBlocks"][number] {
  return {
    id,
    commitFileId: "ignored_by_engine",
    ordinal: 1,
    oldStartLine: 1,
    oldEndLine: 1,
    newStartLine: 1,
    newEndLine: 1,
    patch,
  };
}
