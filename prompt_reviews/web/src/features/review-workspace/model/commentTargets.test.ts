import { describe, expect, it } from "vitest";
import { targetToCommentInput } from "./commentTargets";

describe("targetToCommentInput", () => {
  it("maps block targets to diff block anchors", () => {
    expect(targetToCommentInput({ kind: "block", diffBlockId: "blk_1" })).toEqual({
      scope: { type: "diff_block", diffBlockId: "blk_1" },
      anchor: { kind: "block", diffBlockId: "blk_1" },
    });
  });

  it("maps line targets to one-line range anchors with columns", () => {
    expect(targetToCommentInput({ kind: "line", commitFileId: "file_1", side: "new", line: 42, text: "let x = 1;" })).toEqual({
      scope: { type: "commit_file", commitFileId: "file_1" },
      anchor: {
        kind: "range",
        commitFileId: "file_1",
        side: "new",
        startLine: 42,
        endLine: 42,
        startColumn: 1,
        endColumn: 11,
        selectedText: "let x = 1;",
      },
    });
  });

  it("maps multiline selection targets to range anchors", () => {
    expect(
      targetToCommentInput({
        kind: "range",
        commitFileId: "file_1",
        side: "old",
        startLine: 7,
        endLine: 9,
        startColumn: 3,
        endColumn: 12,
        selectedText: "selected text",
      }),
    ).toEqual({
      scope: { type: "commit_file", commitFileId: "file_1" },
      anchor: {
        kind: "range",
        commitFileId: "file_1",
        side: "old",
        startLine: 7,
        endLine: 9,
        startColumn: 3,
        endColumn: 12,
        selectedText: "selected text",
      },
    });
  });
});
