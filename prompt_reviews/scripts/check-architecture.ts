import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type SourceFile = {
  path: string;
  content: string;
};

export type ArchitectureViolation = {
  filePath: string;
  rule: string;
  message: string;
};

type ImportEdge = {
  specifier: string;
  targetPath?: string;
  packageName?: string;
};

const sourceRoots = ["src", "web/src", "scripts"];
const sourceExtensions = new Set([".ts", ".tsx"]);
const maxSourceFileLines = 500;
const maxDirectSourceFilesPerDirectory = 12;
const packageOnlyImports = new Set(["better-sqlite3", "drizzle-orm"]);
const serviceOnlyForbiddenPackages = new Set(["fastify", "@modelcontextprotocol/sdk", "react"]);
const nodeBuiltinPackages = new Set([
  "node:fs",
  "node:fs/promises",
  "node:path",
  "node:process",
  "node:url",
  "fs",
  "fs/promises",
  "path",
  "process",
  "url",
]);
const legacyTerms = [
  ".prompt-review.md",
  "comments.json",
  "ReviewFile",
  "reviewPath",
  "markdown_path",
  "generated markdown",
];
const prototypeModules = new Set([
  "src/anchors.ts",
  "src/discovery.ts",
  "src/mcp.ts",
  "src/reviews.ts",
  "src/server.ts",
  "src/store.ts",
]);
const architectureRuleFiles = new Set(["scripts/check-architecture.ts"]);
const legacyArtifactFiles = new Set([
  ...prototypeModules,
  // Condemned prototype frontend files. Batch 07 must replace these instead of extending them.
  "web/src/entities/review/api.ts",
  "web/src/entities/review/types.ts",
  "web/src/features/review-workspace/ReviewWorkspacePage.tsx",
  "web/src/features/review-workspace/components/ReviewList.tsx",
  "web/src/features/review-workspace/hooks/reviewQueries.ts",
  "web/src/features/review-workspace/model/reviewWorkspaceStore.ts",
]);

export function checkArchitecture(files: SourceFile[]): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];

  for (const file of files) {
    const filePath = normalizePath(file.path);
    if (isTestFile(filePath)) {
      continue;
    }

    const imports = parseImports(filePath, file.content);
    for (const edge of imports) {
      if (edge.targetPath !== undefined) {
        checkTargetImport(filePath, edge.targetPath, violations);
      }
      if (edge.packageName !== undefined) {
        checkPackageImport(filePath, edge.packageName, violations);
      }
    }

    checkLineCount(filePath, file.content, violations);
    checkLegacyTerms(filePath, file.content, violations);
  }

  checkFlatDirectories(files, violations);

  return violations;
}

export async function loadProjectSourceFiles(projectRoot: string): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  for (const root of sourceRoots) {
    await collectSourceFiles(path.join(projectRoot, root), projectRoot, files);
  }
  return files;
}

export function formatViolations(violations: ArchitectureViolation[]): string {
  return violations
    .map((violation) => `${violation.filePath} [${violation.rule}] ${violation.message}`)
    .join("\n");
}

function checkTargetImport(
  filePath: string,
  targetPath: string,
  violations: ArchitectureViolation[],
): void {
  if (prototypeModules.has(targetPath) && !prototypeModules.has(filePath)) {
    violations.push({
      filePath,
      rule: "prototype-module-quarantine",
      message: `New architecture code must not import condemned prototype module ${targetPath}.`,
    });
  }

  if (
    isUnder(filePath, "src/domain/") &&
    targetsAny(targetPath, [
      "src/anchors.ts",
      "src/discovery.ts",
      "src/mcp.ts",
      "src/reviews.ts",
      "src/server.ts",
      "src/store.ts",
      "src/db/",
      "src/repositories/",
      "src/services/",
      "src/api/",
      "src/mcp/",
      "web/src/",
    ])
  ) {
    violations.push({
      filePath,
      rule: "domain-browser-safe-boundary",
      message: `Shared domain modules must stay browser-safe and cannot import ${targetPath}.`,
    });
  }

  if (isUnder(filePath, "web/src/") && targetsAny(targetPath, ["src/db/", "src/repositories/", "src/services/"])) {
    violations.push({
      filePath,
      rule: "web-no-server-internals",
      message: `Frontend modules must not import server internals from ${targetPath}.`,
    });
  }

  if (
    (isUnder(filePath, "src/api/") || isUnder(filePath, "src/mcp/")) &&
    targetsAny(targetPath, ["src/db/schema.ts", "src/db/rowSchemas.ts", "src/repositories/"])
  ) {
    violations.push({
      filePath,
      rule: "boundary-no-db-shape-leak",
      message: `API and MCP modules must use domain boundary schemas and services, not ${targetPath}.`,
    });
  }

  if (
    isUnder(filePath, "src/services/") &&
    targetsAny(targetPath, ["web/src/", "src/api/", "src/mcp/"])
  ) {
    violations.push({
      filePath,
      rule: "services-no-transport-or-ui",
      message: `Services must stay transport and UI agnostic; forbidden import ${targetPath}.`,
    });
  }

  if (
    isUnder(filePath, "src/db/") &&
    targetsAny(targetPath, ["src/api/", "src/mcp/", "src/services/", "src/legacy/", "web/src/"])
  ) {
    violations.push({
      filePath,
      rule: "db-no-workflow-imports",
      message: `DB modules must not import workflow, transport, legacy, or frontend code from ${targetPath}.`,
    });
  }

  if (targetsAny(targetPath, ["src/db/rowSchemas.ts"]) && !canImportGeneratedRowSchemas(filePath)) {
    violations.push({
      filePath,
      rule: "generated-row-schema-boundary",
      message: "Generated row schemas are DB building blocks and cannot be public API/MCP/frontend contracts.",
    });
  }
}

function checkPackageImport(
  filePath: string,
  packageName: string,
  violations: ArchitectureViolation[],
): void {
  if (
    isUnder(filePath, "src/domain/") &&
    (nodeBuiltinPackages.has(packageName) ||
      packageName === "better-sqlite3" ||
      packageName === "drizzle-orm" ||
      packageName === "fastify" ||
      packageName === "@modelcontextprotocol/sdk" ||
      packageName === "react")
  ) {
    violations.push({
      filePath,
      rule: "domain-browser-safe-boundary",
      message: `Shared domain modules must stay browser-safe and cannot import ${packageName}.`,
    });
  }

  if (
    isUnder(filePath, "web/src/") &&
    (packageName === "better-sqlite3" || packageName === "drizzle-orm")
  ) {
    violations.push({
      filePath,
      rule: "web-no-db-packages",
      message: `Frontend modules must not import ${packageName}.`,
    });
  }

  if ((isUnder(filePath, "src/api/") || isUnder(filePath, "src/mcp/")) && packageName === "drizzle-orm") {
    violations.push({
      filePath,
      rule: "transport-no-drizzle",
      message: "API and MCP modules must not import Drizzle directly.",
    });
  }

  if (isUnder(filePath, "src/services/") && serviceOnlyForbiddenPackages.has(packageName)) {
    violations.push({
      filePath,
      rule: "services-no-transport-or-ui-packages",
      message: `Services must not import ${packageName}.`,
    });
  }

  if (packageOnlyImports.has(packageName) && !canImportDbPackage(filePath)) {
    violations.push({
      filePath,
      rule: "db-package-boundary",
      message: `${packageName} is allowed only in DB, repository, migration, or DB test-support code.`,
    });
  }
}

function checkLegacyTerms(
  filePath: string,
  content: string,
  violations: ArchitectureViolation[],
): void {
  if (canReferenceLegacyTerms(filePath)) {
    return;
  }

  for (const term of legacyTerms) {
    if (content.includes(term)) {
      violations.push({
        filePath,
        rule: "no-primary-legacy-review-artifacts",
        message: `Primary workflow modules must not reference legacy generated artifact term "${term}".`,
      });
    }
  }

  if (/\bbundle\b/.test(content) && !isUnder(filePath, "src/domain/")) {
    violations.push({
      filePath,
      rule: "no-primary-legacy-review-artifacts",
      message: 'Primary workflow modules must not carry forward prototype "bundle" concepts.',
    });
  }
}

function checkLineCount(
  filePath: string,
  content: string,
  violations: ArchitectureViolation[],
): void {
  if (prototypeModules.has(filePath)) {
    return;
  }

  const lineCount = content.split(/\r?\n/).length;
  if (lineCount <= maxSourceFileLines) {
    return;
  }

  violations.push({
    filePath,
    rule: "source-file-line-limit",
    message: `Source files must stay under ${maxSourceFileLines} lines; found ${lineCount}.`,
  });
}

function checkFlatDirectories(
  files: SourceFile[],
  violations: ArchitectureViolation[],
): void {
  const filesByDirectory = new Map<string, SourceFile[]>();

  for (const file of files) {
    const filePath = normalizePath(file.path);
    if (isTestFile(filePath)) {
      continue;
    }

    const directory = path.posix.dirname(filePath);
    const filesInDirectory = filesByDirectory.get(directory) ?? [];
    filesInDirectory.push(file);
    filesByDirectory.set(directory, filesInDirectory);
  }

  for (const [directory, directoryFiles] of filesByDirectory) {
    if (directoryFiles.length <= maxDirectSourceFilesPerDirectory) {
      continue;
    }

    violations.push({
      filePath: directory,
      rule: "flat-directory-file-limit",
      message: `Source directories may contain at most ${maxDirectSourceFilesPerDirectory} direct source files before adding subdirectories; found ${directoryFiles.length}.`,
    });
  }
}

function parseImports(filePath: string, content: string): ImportEdge[] {
  const edges: ImportEdge[] = [];
  const importPatterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of importPatterns) {
    for (const match of content.matchAll(pattern)) {
      const specifier = match[1];
      edges.push(resolveImport(filePath, specifier));
    }
  }

  return edges;
}

function resolveImport(filePath: string, specifier: string): ImportEdge {
  if (specifier.startsWith(".")) {
    return {
      specifier,
      targetPath: normalizeResolvedPath(path.posix.dirname(filePath), specifier),
    };
  }

  if (specifier.startsWith("@/")) {
    return {
      specifier,
      targetPath: normalizeResolvedPath("web/src", specifier.slice(2)),
    };
  }

  if (specifier.startsWith("@domain/")) {
    return {
      specifier,
      targetPath: normalizeResolvedPath("src/domain", specifier.slice("@domain/".length)),
    };
  }

  return {
    specifier,
    packageName: packageNameFromSpecifier(specifier),
  };
}

function normalizeResolvedPath(basePath: string, specifier: string): string {
  const withoutQuery = specifier.split("?")[0] ?? specifier;
  const joined = normalizePath(path.posix.normalize(path.posix.join(basePath, withoutQuery)));
  if (sourceExtensions.has(path.posix.extname(joined))) {
    return joined;
  }
  if (joined.endsWith(".js") || joined.endsWith(".jsx")) {
    return `${joined.slice(0, -path.posix.extname(joined).length)}.ts`;
  }
  return `${joined}.ts`;
}

function packageNameFromSpecifier(specifier: string): string {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }
  return specifier.split("/")[0] ?? specifier;
}

async function collectSourceFiles(
  directory: string,
  projectRoot: string,
  files: SourceFile[],
): Promise<void> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = normalizePath(path.relative(projectRoot, absolutePath));
    if (entry.isDirectory()) {
      if (relativePath.endsWith("__tests__")) {
        continue;
      }
      await collectSourceFiles(absolutePath, projectRoot, files);
      continue;
    }
    if (!sourceExtensions.has(path.extname(entry.name))) {
      continue;
    }
    files.push({
      path: relativePath,
      content: await readFile(absolutePath, "utf8"),
    });
  }
}

function canImportDbPackage(filePath: string): boolean {
  return (
    isUnder(filePath, "src/db/") ||
    isUnder(filePath, "src/repositories/") ||
    isUnder(filePath, "src/test-support/db/") ||
    isUnder(filePath, "drizzle/")
  );
}

function canImportGeneratedRowSchemas(filePath: string): boolean {
  return (
    isUnder(filePath, "src/db/") ||
    isUnder(filePath, "src/repositories/") ||
    isUnder(filePath, "src/test-support/db/") ||
    filePath.endsWith(".repository.test.ts") ||
    filePath.endsWith(".db.test.ts") ||
    filePath.endsWith(".domain-composition.test.ts")
  );
}

function canReferenceLegacyTerms(filePath: string): boolean {
  return (
    legacyArtifactFiles.has(filePath) ||
    architectureRuleFiles.has(filePath) ||
    isUnder(filePath, "src/legacy/") ||
    filePath.endsWith(".legacy-import.test.ts") ||
    filePath.endsWith(".importer.test.ts")
  );
}

function targetsAny(targetPath: string, prefixesOrFiles: string[]): boolean {
  return prefixesOrFiles.some((prefixOrFile) =>
    prefixOrFile.endsWith("/") ? isUnder(targetPath, prefixOrFile) : targetPath === prefixOrFile,
  );
}

function isTestFile(filePath: string): boolean {
  return filePath.endsWith(".test.ts") || filePath.includes("/__tests__/");
}

function isUnder(filePath: string, prefix: string): boolean {
  return filePath.startsWith(prefix);
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const files = await loadProjectSourceFiles(projectRoot);
  const violations = checkArchitecture(files);

  if (violations.length > 0) {
    console.error(formatViolations(violations));
    process.exit(1);
  }

  console.log(`Architecture boundaries passed for ${files.length} source files.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
