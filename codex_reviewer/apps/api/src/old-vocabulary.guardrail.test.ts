import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceRoots = ["apps/api/src", "apps/web/src", "packages/contracts/src"];

const blockedTerms = [
  { label: "classifications", pattern: /\bclassifications?\b/g },
  { label: "classify", pattern: /\bclassify\b/g },
  { label: "tag", pattern: /\btag\b/g },
  { label: "tags", pattern: /\btags\b/g },
  { label: "taggings", pattern: /\btaggings?\b/g },
  { label: "primaryTag", pattern: /primaryTag/g },
  { label: "secondaryTag", pattern: /secondaryTag/g },
  { label: "tagSlug", pattern: /tagSlug/g },
  { label: "decision", pattern: /\bdecision\b/g },
  { label: "decisions", pattern: /\bdecisions\b/g },
  { label: "outcome", pattern: /\boutcome\b/g },
  { label: "outcomes", pattern: /\boutcomes\b/g },
  { label: "action", pattern: /\baction\b/g },
  { label: "actions", pattern: /\bactions\b/g },
  { label: "remainingWork", pattern: /remainingWork/g },
  { label: "nextAction", pattern: /nextAction/g },
  { label: "finalization", pattern: /\bfinalization\b/g },
  { label: "finalized", pattern: /\bfinalized\b/g },
  { label: "readiness", pattern: /\breadiness\b/g },
  { label: "readyForApproval", pattern: /readyForApproval/g },
  { label: "version_closure", pattern: /\bversion_closure\b/g },
  { label: "DONE", pattern: /\bDONE\b/g },
  { label: "projection", pattern: /\bprojection\b/g },
  { label: "compat", pattern: /\bcompat\b/g },
] as const;

const allowedMatches = [
  {
    path: "packages/contracts/src/review.test.ts",
    label: "DONE",
    lineIncludes: 'ReviewMarkSchema.parse("DONE")',
  },
  {
    path: "apps/api/src/db/schema.test.ts",
    label: "DONE",
    lineIncludes: '"DONE"',
  },
  {
    path: "apps/api/src/review/ingest-service.test.ts",
    label: "DONE",
    lineIncludes: 'not.toContain("DONE")',
  },
  {
    path: "packages/contracts/src/review/review-notes.ts",
    label: "action",
    lineIncludes: "action",
  },
  {
    path: "packages/contracts/src/review/review-notes.ts",
    label: "actions",
    lineIncludes: "actions",
  },
] as const;

describe("old product vocabulary guardrail", () => {
  it("keeps prototype review vocabulary out of implementation source", () => {
    const repoRoot = findRepoRoot();
    const offenses = sourceRoots.flatMap((root) => scanSourceRoot(join(repoRoot, root), repoRoot));

    expect(offenses).toEqual([]);
  });
});

function scanSourceRoot(root: string, repoRoot: string): string[] {
  return sourceFiles(root).flatMap((file) => {
    const text = readFileSync(file, "utf8");
    const relativePath = relative(repoRoot, file);
    return text
      .split("\n")
      .flatMap((line, index) =>
        blockedTerms.flatMap(({ label, pattern }) => {
          pattern.lastIndex = 0;
          if (!pattern.test(line) || isAllowedMatch(relativePath, label, line)) {
            return [];
          }
          return [`${relativePath}:${index + 1}: ${label}`];
        }),
      );
  });
}

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (entry === "dist" || entry === "node_modules") {
        return [];
      }
      return sourceFiles(path);
    }
    if (!stats.isFile() || !/\.(ts|tsx)$/.test(entry) || entry === "old-vocabulary.guardrail.test.ts") {
      return [];
    }
    return [path];
  });
}

function isAllowedMatch(path: string, label: string, line: string): boolean {
  return allowedMatches.some(
    (match) => match.path === path && match.label === label && line.includes(match.lineIncludes),
  );
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
