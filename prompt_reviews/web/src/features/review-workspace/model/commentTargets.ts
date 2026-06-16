import type { ReviewEntityScope, SourceAnchor } from "@/entities/review/types";

export type ReviewCommentTarget =
  | { kind: "version"; versionId: string }
  | { kind: "commit"; commitId: string }
  | { kind: "file"; commitFileId: string }
  | { kind: "block"; diffBlockId: string }
  | {
      kind: "line";
      commitFileId: string;
      side: "old" | "new";
      line: number;
      text: string;
    }
  | {
      kind: "range";
      commitFileId: string;
      side: "old" | "new";
      startLine: number;
      endLine: number;
      startColumn: number;
      endColumn: number;
      selectedText: string;
    };

export function targetToCommentInput(target: ReviewCommentTarget): {
  scope: ReviewEntityScope;
  anchor: SourceAnchor;
} {
  switch (target.kind) {
    case "version":
      return { scope: { type: "version", versionId: target.versionId }, anchor: { kind: "scope" } };
    case "commit":
      return { scope: { type: "commit", commitId: target.commitId }, anchor: { kind: "scope" } };
    case "file":
      return {
        scope: { type: "commit_file", commitFileId: target.commitFileId },
        anchor: { kind: "scope" },
      };
    case "block":
      return {
        scope: { type: "diff_block", diffBlockId: target.diffBlockId },
        anchor: { kind: "block", diffBlockId: target.diffBlockId },
      };
    case "line":
      return {
        scope: { type: "commit_file", commitFileId: target.commitFileId },
        anchor: {
          kind: "range",
          commitFileId: target.commitFileId,
          side: target.side,
          startLine: target.line,
          endLine: target.line,
          startColumn: 1,
          endColumn: Math.max(target.text.length + 1, 1),
          selectedText: target.text.trim() || undefined,
        },
      };
    case "range":
      return {
        scope: { type: "commit_file", commitFileId: target.commitFileId },
        anchor: {
          kind: "range",
          commitFileId: target.commitFileId,
          side: target.side,
          startLine: target.startLine,
          endLine: target.endLine,
          startColumn: target.startColumn,
          endColumn: target.endColumn,
          selectedText: target.selectedText.trim() || undefined,
        },
      };
  }
}

export function targetLabel(target: ReviewCommentTarget | null): string {
  if (target === null) {
    return "Choose a line, selection, block, file, commit, or version";
  }
  switch (target.kind) {
    case "version":
      return "Version comment";
    case "commit":
      return "Commit comment";
    case "file":
      return "File comment";
    case "block":
      return "Diff block comment";
    case "line":
      return `${target.side === "old" ? "Old" : "New"} line ${target.line}`;
    case "range":
      return `${target.side === "old" ? "Old" : "New"} lines ${target.startLine}-${target.endLine}`;
  }
}
