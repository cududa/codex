import { describe, expect, it } from "vitest";
import {
  extractChangedLineRuns,
  mapCommitFileDiff,
  mapSourceRangeToDiff,
  type CommitFileDiffMappingInput,
} from "./diffMapping.js";

describe("detector diff mapping", () => {
  it("maps unified diff changed lines to commit file, diff block, side, and line ranges", () => {
    const mappings = mapCommitFileDiff({
      id: "file-1",
      oldPath: "src/example.ts",
      newPath: "src/example.ts",
      diffBlocks: [
        {
          id: "block-2",
          commitFileId: "file-1",
          ordinal: 2,
          oldStartLine: 30,
          oldEndLine: 30,
          newStartLine: 31,
          newEndLine: 31,
          patch: ["@@ -30,1 +31,1 @@", "-return false;", "+return true;"].join("\n"),
        },
        {
          id: "block-1",
          commitFileId: "file-1",
          ordinal: 1,
          oldStartLine: 10,
          oldEndLine: 13,
          newStartLine: 10,
          newEndLine: 14,
          patch: [
            "@@ -10,4 +10,5 @@ function example",
            " const before = true;",
            "-oldCall();",
            "+newCall();",
            "+extraCall();",
            " return before;",
          ].join("\n"),
        },
      ],
    });

    expect(mappings).toEqual([
      {
        mappingKey: "file-1:block-1:changed_lines:old:11-11",
        mappingKind: "changed_lines",
        commitFileId: "file-1",
        diffBlockId: "block-1",
        diffBlockOrdinal: 1,
        path: "src/example.ts",
        side: "old",
        startLine: 11,
        endLine: 11,
        oldStartLine: 11,
        oldEndLine: 11,
        newStartLine: null,
        newEndLine: null,
        reason: "changed_line_range_from_unified_diff_hunk",
      },
      {
        mappingKey: "file-1:block-1:changed_lines:new:11-12",
        mappingKind: "changed_lines",
        commitFileId: "file-1",
        diffBlockId: "block-1",
        diffBlockOrdinal: 1,
        path: "src/example.ts",
        side: "new",
        startLine: 11,
        endLine: 12,
        oldStartLine: null,
        oldEndLine: null,
        newStartLine: 11,
        newEndLine: 12,
        reason: "changed_line_range_from_unified_diff_hunk",
      },
      {
        mappingKey: "file-1:block-2:changed_lines:old:30-30",
        mappingKind: "changed_lines",
        commitFileId: "file-1",
        diffBlockId: "block-2",
        diffBlockOrdinal: 2,
        path: "src/example.ts",
        side: "old",
        startLine: 30,
        endLine: 30,
        oldStartLine: 30,
        oldEndLine: 30,
        newStartLine: null,
        newEndLine: null,
        reason: "changed_line_range_from_unified_diff_hunk",
      },
      {
        mappingKey: "file-1:block-2:changed_lines:new:31-31",
        mappingKind: "changed_lines",
        commitFileId: "file-1",
        diffBlockId: "block-2",
        diffBlockOrdinal: 2,
        path: "src/example.ts",
        side: "new",
        startLine: 31,
        endLine: 31,
        oldStartLine: null,
        oldEndLine: null,
        newStartLine: 31,
        newEndLine: 31,
        reason: "changed_line_range_from_unified_diff_hunk",
      },
    ]);
  });

  it("maps added-file hunks to new-side ranges without inventing old-side ranges", () => {
    const mappings = mapCommitFileDiff({
      id: "file-added",
      oldPath: null,
      newPath: "src/new.ts",
      diffBlocks: [
        {
          id: "block-added",
          commitFileId: "file-added",
          ordinal: 1,
          oldStartLine: null,
          oldEndLine: null,
          newStartLine: 1,
          newEndLine: 3,
          patch: ["@@ -0,0 +1,3 @@", "+export const one = 1;", "+export const two = 2;", "+export const three = 3;"].join("\n"),
        },
      ],
    });

    expect(mappings).toMatchObject([
      {
        mappingKind: "changed_lines",
        commitFileId: "file-added",
        diffBlockId: "block-added",
        path: "src/new.ts",
        side: "new",
        startLine: 1,
        endLine: 3,
        oldStartLine: null,
        newStartLine: 1,
        newEndLine: 3,
      },
    ]);
  });

  it("returns path-only fallback for diff blocks without hunk ranges", () => {
    const mappings = mapCommitFileDiff({
      id: "file-mode",
      oldPath: "scripts/run.sh",
      newPath: "scripts/run.sh",
      diffBlocks: [
        {
          id: "block-mode",
          commitFileId: "file-mode",
          ordinal: 1,
          oldStartLine: null,
          oldEndLine: null,
          newStartLine: null,
          newEndLine: null,
          patch: "diff --git a/scripts/run.sh b/scripts/run.sh\nold mode 100644\nnew mode 100755",
        },
      ],
    });

    expect(mappings).toEqual([
      {
        mappingKey: "file-mode:block-mode:path_only:path:path",
        mappingKind: "path_only",
        commitFileId: "file-mode",
        diffBlockId: "block-mode",
        diffBlockOrdinal: 1,
        path: "scripts/run.sh",
        side: null,
        startLine: null,
        endLine: null,
        oldStartLine: null,
        oldEndLine: null,
        newStartLine: null,
        newEndLine: null,
        reason: "diff_block_has_no_hunk_range",
      },
    ]);
  });

  it("clips source range overlaps to finding-ready old and new side ranges", () => {
    const file = exampleFile();

    expect(mapSourceRangeToDiff(file, { path: "src/example.ts", startLine: 12, endLine: 20 })).toMatchObject([
      {
        mappingKey: "file-1:block-1:changed_lines:new:12-12",
        diffBlockId: "block-1",
        side: "new",
        startLine: 12,
        endLine: 12,
        newStartLine: 12,
        newEndLine: 12,
        reason: "changed_line_range_overlaps_source_range",
      },
    ]);

    expect(mapSourceRangeToDiff(file, { path: "src/example.ts", startLine: 11, endLine: 11 })).toMatchObject([
      {
        diffBlockId: "block-1",
        side: "old",
        startLine: 11,
        endLine: 11,
        oldStartLine: 11,
        oldEndLine: 11,
      },
      {
        diffBlockId: "block-1",
        side: "new",
        startLine: 11,
        endLine: 11,
        newStartLine: 11,
        newEndLine: 11,
      },
    ]);
  });

  it("returns path-only fallback when a file path matches but changed lines do not overlap", () => {
    expect(mapSourceRangeToDiff(exampleFile(), { path: "src/example.ts", startLine: 200, endLine: 205 })).toEqual([
      {
        mappingKey: "file-1:file:path_only:path:path",
        mappingKind: "path_only",
        commitFileId: "file-1",
        diffBlockId: null,
        diffBlockOrdinal: null,
        path: "src/example.ts",
        side: null,
        startLine: null,
        endLine: null,
        oldStartLine: null,
        oldEndLine: null,
        newStartLine: null,
        newEndLine: null,
        reason: "path_matches_without_changed_line_overlap",
      },
    ]);
  });

  it("exposes deterministic standalone changed-line extraction for parser-level tests", () => {
    expect(extractChangedLineRuns(["@@ -5,2 +5,2 @@", "-old", "+new", " same"].join("\n"))).toMatchObject([
      { side: "old", startLine: 5, endLine: 5 },
      { side: "new", startLine: 5, endLine: 5 },
    ]);
  });
});

function exampleFile(): CommitFileDiffMappingInput {
  return {
    id: "file-1",
    oldPath: "src/example.ts",
    newPath: "src/example.ts",
    diffBlocks: [
      {
        id: "block-1",
        commitFileId: "file-1",
        ordinal: 1,
        oldStartLine: 10,
        oldEndLine: 13,
        newStartLine: 10,
        newEndLine: 14,
        patch: [
          "@@ -10,4 +10,5 @@ function example",
          " const before = true;",
          "-oldCall();",
          "+newCall();",
          "+extraCall();",
          " return before;",
        ].join("\n"),
      },
    ],
  };
}
