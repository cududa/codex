import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testRoots = ["apps/api/src", "packages/contracts/src"];
const maxTestFileLines = 400;

describe("test architecture guardrail", () => {
  it("keeps API and contract tests split into focused files", () => {
    const repoRoot = findRepoRoot();
    const oversizedTests = testRoots.flatMap((root) =>
      testFiles(join(repoRoot, root)).flatMap((file) => {
        const lineCount = readFileSync(file, "utf8").split("\n").length;
        if (lineCount <= maxTestFileLines) {
          return [];
        }
        return [`${relative(repoRoot, file)} has ${lineCount} lines; max is ${maxTestFileLines}`];
      }),
    );

    expect(oversizedTests).toEqual([]);
  });
});

function testFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (entry === "dist" || entry === "node_modules") {
        return [];
      }
      return testFiles(path);
    }
    if (!stats.isFile() || !/\.test\.(ts|tsx)$/.test(entry)) {
      return [];
    }
    return [path];
  });
}

function findRepoRoot(): string {
  let directory = dirname(fileURLToPath(import.meta.url));
  while (directory !== dirname(directory)) {
    if (directory.endsWith("codex_reviewer")) {
      return directory;
    }
    directory = dirname(directory);
  }
  throw new Error("Unable to locate codex_reviewer repository root.");
}
