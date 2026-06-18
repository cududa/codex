import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { guardrailRules } from "./rules.js";
import { type GuardrailRuleId, type GuardrailViolation, type SourceFile, ruleDescriptions } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = join(__dirname, "..", "..", "..", "..");

const activeSourceRoots = [
  "packages/contracts/src",
  "apps/api/src",
  "apps/web/src",
  "apps/mcp/src",
  "packages/mcp/src",
  "apps/ingest/src",
  "packages/ingest/src",
  "apps/concern-map/src",
  "packages/concern-map/src",
] as const;

const excludedPathParts = new Set([
  "node_modules",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".next",
  ".vite",
  "docs",
]);

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);

export function runGuardrails(files: readonly SourceFile[]): readonly GuardrailViolation[] {
  return files.flatMap((file) => guardrailRules.flatMap((rule) => rule.check(file)));
}

export function readActiveSourceFiles(): readonly SourceFile[] {
  return activeSourceRoots.flatMap((root) => {
    const absoluteRoot = join(workspaceRoot, root);
    if (!existsSync(absoluteRoot)) {
      return [];
    }

    return walkSourceFiles(absoluteRoot).map((path) => ({
      path,
      relativePath: relative(workspaceRoot, path),
      content: readFileSync(path, "utf8"),
    }));
  });
}

export function sourceFile(relativePath: string, content: string): SourceFile {
  return {
    path: join(workspaceRoot, relativePath),
    relativePath,
    content,
  };
}

export function scanPatterns(
  file: SourceFile,
  ruleId: GuardrailRuleId,
  patterns: readonly RegExp[],
): readonly GuardrailViolation[] {
  return patterns.flatMap((pattern) => scanPattern(file, ruleId, pattern));
}

export function formatViolations(violations: readonly GuardrailViolation[]): string {
  if (violations.length === 0) {
    return "";
  }

  return violations
    .map(
      (violation) =>
        `${violation.ruleId}: ${violation.filePath}${
          violation.line === null ? "" : `:${violation.line}`
        }\n  ${violation.description}\n  ${violation.snippet}`,
    )
    .join("\n\n");
}

function walkSourceFiles(root: string): readonly string[] {
  const entries = readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    const relativePath = relative(workspaceRoot, path);
    if (isExcludedPath(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(path));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(extensionOf(entry.name)) && !isGuardrailImplementation(relativePath)) {
      files.push(path);
    }
  }

  return files;
}

function scanPattern(file: SourceFile, ruleId: GuardrailRuleId, pattern: RegExp): readonly GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  let match = globalPattern.exec(file.content);

  while (match !== null) {
    violations.push({
      ruleId,
      description: ruleDescriptions[ruleId],
      filePath: file.relativePath,
      line: lineNumberAt(file.content, match.index),
      snippet: snippetAt(file.content, match.index, match[0].length),
    });

    if (match[0].length === 0) {
      globalPattern.lastIndex += 1;
    }

    match = globalPattern.exec(file.content);
  }

  return violations;
}

function isGuardrailImplementation(path: string): boolean {
  return path === "packages/contracts/src/guardrails.test.ts" || path.startsWith("packages/contracts/src/guardrails/");
}

function isExcludedPath(path: string): boolean {
  return path.split(sep).some((part) => excludedPathParts.has(part));
}

function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  return index === -1 ? "" : fileName.slice(index);
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function snippetAt(content: string, index: number, length: number): string {
  const lineStart = content.lastIndexOf("\n", index) + 1;
  const lineEndIndex = content.indexOf("\n", index);
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
  const line = content.slice(lineStart, lineEnd).trim();

  if (line.length > 180) {
    const matchStart = Math.max(0, index - lineStart - 40);
    const matchEnd = Math.min(line.length, index - lineStart + length + 40);
    return line.slice(matchStart, matchEnd);
  }

  return line;
}
