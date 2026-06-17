import type { RootServiceContext } from "../services/serviceContext.js";
import { createReviewReadService } from "../services/reviewReadService.js";

export type ExportMarkdownReportOptions = {
  versionId: string;
};

export function exportMarkdownReport(context: RootServiceContext, options: ExportMarkdownReportOptions): string {
  const read = createReviewReadService(context);
  const version = read.getVersionDetail(options.versionId);
  const lines: string[] = [
    "# Prompt Review Report",
    "",
    "> Read-only projection from the prompt review database. Do not edit this markdown to change review state; use the app, API, or MCP tools instead.",
    "",
    `Version: ${version.label}`,
    `Status: ${version.status}`,
    "",
    "## Progress",
    "",
    `- Commits: ${version.progress.reviewedCommits}/${version.progress.totalCommits} reviewed`,
    `- Files: ${version.progress.reviewedFiles}/${version.progress.totalFiles} reviewed`,
    `- Unresolved comments: ${version.progress.unresolvedComments}`,
    `- Pending decisions: ${version.progress.pendingDecisions}`,
    `- Incomplete plans: ${version.progress.incompletePlans}`,
    "",
    "## Commits",
    "",
  ];

  for (const commit of version.commits) {
    const detail = read.getCommitDetail(commit.id);
    lines.push(`### ${detail.sha.slice(0, 10)} ${detail.title}`, "");
    lines.push(`Status: ${detail.status}`, "");
    for (const file of detail.files) {
      lines.push(`- ${file.path} (${file.status})`);
      for (const comment of file.review.comments) {
        lines.push(`  - Comment ${comment.id} [${comment.status}]: ${singleLine(comment.body)}`);
      }
      for (const block of file.diffBlocks) {
        for (const comment of block.comments) {
          lines.push(`  - Diff block ${block.id} comment ${comment.id} [${comment.status}]: ${singleLine(comment.body)}`);
        }
      }
      for (const decision of file.review.decisions) {
        lines.push(`  - Decision ${decision.id} [${decision.status}/${decision.outcome}]`);
      }
      for (const plan of file.review.plans) {
        lines.push(`  - Plan ${plan.id} [${plan.status}]: ${singleLine(plan.title)}`);
      }
    }
    for (const comment of detail.comments) {
      lines.push(`- Commit comment ${comment.id} [${comment.status}]: ${singleLine(comment.body)}`);
    }
    for (const decision of detail.decisions) {
      lines.push(`- Commit decision ${decision.id} [${decision.status}/${decision.outcome}]`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
