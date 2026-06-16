import { describe, expect, it } from "vitest";
import { parseGitDiff } from "../git/diffParser.js";
import { buildDiffBlocksForFile } from "./diffBlockBuilder.js";

describe("buildDiffBlocksForFile", () => {
  it("creates stable hunk keys, ranges, hashes, and patch text", () => {
    const parsedFiles = parseGitDiff([
      "diff --git a/src/example.ts b/src/example.ts",
      "--- a/src/example.ts",
      "+++ b/src/example.ts",
      "@@ -10,2 +10,3 @@ function example",
      " const before = true;",
      "-oldCall();",
      "+newCall();",
      "+extraCall();",
      "@@ -30,1 +31,1 @@",
      "-return false;",
      "+return true;",
    ].join("\n"));

    const blocks = buildDiffBlocksForFile(
      { oldPath: "src/example.ts", newPath: "src/example.ts", changeType: "modified" },
      parsedFiles,
    );

    expect(blocks).toEqual([
      {
        blockKey: "hunk-0001",
        ordinal: 1,
        contentHash: "3d98e718b5c826ccb6a5e893b91d3456cf6d27ab31c77254f1d62e902b54edb4",
        heading: "function example",
        oldStartLine: 10,
        oldEndLine: 11,
        newStartLine: 10,
        newEndLine: 12,
        patch: [
          "@@ -10,2 +10,3 @@ function example",
          " const before = true;",
          "-oldCall();",
          "+newCall();",
          "+extraCall();",
        ].join("\n"),
      },
      {
        blockKey: "hunk-0002",
        ordinal: 2,
        contentHash: "b7aa1930d5fcea7bab337b065803b004f19c2a475f8a6cf5992edaa5cf164705",
        heading: null,
        oldStartLine: 30,
        oldEndLine: 30,
        newStartLine: 31,
        newEndLine: 31,
        patch: ["@@ -30,1 +31,1 @@", "-return false;", "+return true;"].join("\n"),
      },
    ]);
  });

  it("creates a reviewable fallback block for files without hunks", () => {
    const parsedFiles = parseGitDiff(
      ["diff --git a/scripts/run.sh b/scripts/run.sh", "old mode 100644", "new mode 100755"].join("\n"),
    );

    expect(
      buildDiffBlocksForFile(
        { oldPath: "scripts/run.sh", newPath: "scripts/run.sh", changeType: "mode_changed" },
        parsedFiles,
      ),
    ).toMatchObject([
      {
        blockKey: "hunk-0001",
        ordinal: 1,
        oldStartLine: null,
        newStartLine: null,
        patch: "diff --git a/scripts/run.sh b/scripts/run.sh\nold mode 100644\nnew mode 100755",
      },
    ]);
  });
});
