import { describe, expect, it } from "vitest";
import { parseGitChangedFiles } from "./changeFiles.js";

describe("parseGitChangedFiles", () => {
  it("parses supported git file statuses with stable line stats", () => {
    expect(
      parseGitChangedFiles({
        nameStatus: [
          "A\tsrc/added.ts",
          "M\tsrc/modified.ts",
          "D\tsrc/deleted.ts",
          "R100\tsrc/old.ts\tsrc/new.ts",
          "C100\tsrc/source.ts\tsrc/copied.ts",
          "M\tscripts/run.sh",
        ].join("\n"),
        numstat: [
          "2\t0\tsrc/added.ts",
          "3\t1\tsrc/modified.ts",
          "0\t4\tsrc/deleted.ts",
          "1\t1\tsrc/{old.ts => new.ts}",
          "5\t0\tsrc/{source.ts => copied.ts}",
          "0\t0\tscripts/run.sh",
        ].join("\n"),
        summary: " mode change 100644 => 100755 scripts/run.sh",
      }),
    ).toEqual([
      { oldPath: null, newPath: "src/added.ts", changeType: "added", additions: 2, deletions: 0 },
      {
        oldPath: "src/modified.ts",
        newPath: "src/modified.ts",
        changeType: "modified",
        additions: 3,
        deletions: 1,
      },
      { oldPath: "src/deleted.ts", newPath: null, changeType: "deleted", additions: 0, deletions: 4 },
      { oldPath: "src/old.ts", newPath: "src/new.ts", changeType: "renamed", additions: 1, deletions: 1 },
      { oldPath: "src/source.ts", newPath: "src/copied.ts", changeType: "copied", additions: 5, deletions: 0 },
      {
        oldPath: "scripts/run.sh",
        newPath: "scripts/run.sh",
        changeType: "mode_changed",
        additions: 0,
        deletions: 0,
      },
    ]);
  });
});
