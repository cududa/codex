import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DetectorFinding, DetectorFindingSummary } from "@/entities/review/types";
import { CommitQueue } from "../CommitQueue";
import { DetectorFindingPanel } from "./DetectorFindings";
import { FileQueue } from "../FileQueue";

describe("review detector finding UI", () => {
  it("renders compact detector summaries in commit queue entries", () => {
    const html = renderToStaticMarkup(
      <CommitQueue
        commits={[
          {
            id: "commit-1",
            versionId: "version-1",
            sha: "abcdef123456",
            title: "Adjust harness prompt",
            status: "unreviewed",
            secondaryTagSlugs: [],
            fileCount: 2,
            detectorFindingSummaries: [detectorSummary("commit", "commit-1")],
          },
        ]}
        isLoading={false}
        missingDecisionIds={new Set()}
        onSelect={() => undefined}
        selectedCommit={undefined}
        selectedCommitId={null}
      />,
    );

    expect(html).toContain("1 finding");
    expect(html).toContain("harness-prompts");
    expect(html).toContain("high risk");
    expect(html).toContain("medium confidence");
    expect(html).toContain("Prompt wording changed");
  });

  it("renders compact detector summaries in file queue entries", () => {
    const html = renderToStaticMarkup(
      <FileQueue
        files={[
          {
            id: "file-1",
            commitId: "commit-1",
            path: "codex-rs/core/src/prompt.rs",
            changeType: "modified",
            status: "unreviewed",
            secondaryTagSlugs: [],
            detectorFindingSummaries: [detectorSummary("commit_file", "file-1")],
          },
        ]}
        isLoading={false}
        missingDecisionIds={new Set()}
        onSelect={() => undefined}
        selectedFile={undefined}
        selectedFileId={null}
      />,
    );

    expect(html).toContain("1 finding");
    expect(html).toContain("harness-prompts");
    expect(html).toContain("codex-rs/core/src/prompt.rs");
  });

  it("renders full detector finding evidence for review panes", () => {
    const html = renderToStaticMarkup(
      <DetectorFindingPanel findings={[detectorFinding()]} title="Diff block detector findings" />,
    );

    expect(html).toContain("Diff block detector findings");
    expect(html).toContain("Prompt wording changed");
    expect(html).toContain("The system prompt text changed near a goal instruction.");
    expect(html).toContain("path: codex-rs/core/src/prompt.rs");
    expect(html).toContain("symbol: BASE_INSTRUCTIONS");
    expect(html).toContain("seed node matched prompt marker");
  });
});

function detectorSummary(targetType: "commit" | "commit_file", targetId: string): DetectorFindingSummary {
  return {
    concernSlug: "harness-prompts",
    targetType,
    targetId,
    count: 1,
    highestRiskLevel: "high",
    highestConfidence: "medium",
    evidenceSummaries: ["Prompt wording changed"],
  };
}

function detectorFinding(): DetectorFinding {
  return {
    id: "finding-1",
    runId: "run-1",
    versionId: "version-1",
    commitId: "commit-1",
    commitFileId: "file-1",
    diffBlockId: "block-1",
    graphNodeId: "node-1",
    graphNodeKey: "symbol:BASE_INSTRUCTIONS",
    findingKey: "finding-key-1",
    concernSlug: "harness-prompts",
    target: { type: "diff_block", diffBlockId: "block-1" },
    path: "codex-rs/core/src/prompt.rs",
    side: "new",
    startLine: 42,
    endLine: 43,
    symbol: "BASE_INSTRUCTIONS",
    marker: "goal",
    evidenceKind: "diff_block",
    title: "Prompt wording changed",
    summary: "Prompt wording changed",
    rationale: "The system prompt text changed near a goal instruction.",
    riskLevel: "high",
    confidence: "medium",
    evidence: [
      {
        nodeKey: "symbol:BASE_INSTRUCTIONS",
        path: "codex-rs/core/src/prompt.rs",
        symbol: "BASE_INSTRUCTIONS",
        marker: "goal",
        reason: "seed node matched prompt marker",
      },
    ],
    createdAt: 1,
  };
}
