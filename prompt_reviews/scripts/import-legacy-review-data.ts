import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openPromptReviewsDatabase } from "../src/db/client.js";
import { migratePromptReviewsDatabase } from "../src/db/migrate.js";
import { createServiceContext } from "../src/services/serviceContext.js";
import { importLegacyCommentsJson } from "../src/legacy/commentsJsonImport.js";
import { parseLegacyMarkdownReview, summarizeLegacyMarkdownReview } from "../src/legacy/markdownImport.js";
import { emptyLegacyImportCounts, type LegacyImportReport, type LegacyImportWarning } from "../src/legacy/types.js";

type CliOptions = {
  projectRoot: string;
  promptReviewsDir: string;
  databasePath: string;
  commentsJsonPath: string;
  dryRun: boolean;
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const database = openPromptReviewsDatabase(options.databasePath);
  try {
    migratePromptReviewsDatabase(database, { migrationsFolder: path.join(options.promptReviewsDir, "drizzle") });
    const context = createServiceContext({ db: database.db });
    const report = await importLegacyArtifacts(context, options);
    printReport(report);
    if (report.warnings.length > 0) {
      process.exitCode = 2;
    }
  } finally {
    database.close();
  }
}

export async function importLegacyArtifacts(
  context: ReturnType<typeof createServiceContext>,
  options: CliOptions,
): Promise<LegacyImportReport> {
  const warnings: LegacyImportWarning[] = [];
  const counts = emptyLegacyImportCounts();
  const markdownFiles = await findLegacyMarkdownFiles(options.promptReviewsDir);

  for (const filePath of markdownFiles) {
    const relativePath = path.relative(options.projectRoot, filePath).replaceAll("\\", "/");
    const review = parseLegacyMarkdownReview(relativePath, await readFile(filePath, "utf8"));
    const summary = summarizeLegacyMarkdownReview(context.db, review);
    warnings.push(...summary.warnings);
    if (summary.matchedVersionId !== undefined) {
      counts.versions += 1;
    }
    if (summary.matchedCommitId !== undefined) {
      counts.commits += 1;
    }
    if (summary.matchedCommitFileId !== undefined) {
      counts.files += 1;
    }
    counts.diffBlocks += summary.matchedDiffBlockIds.length;
  }

  if (existsSync(options.commentsJsonPath)) {
    const commentsReport = await importLegacyCommentsJson(context, {
      projectRoot: options.projectRoot,
      commentsJsonPath: options.commentsJsonPath,
      dryRun: options.dryRun,
    });
    mergeReports({ counts, warnings }, commentsReport);
  }

  return { dryRun: options.dryRun, counts: { ...counts, warnings: warnings.length }, warnings };
}

function parseArgs(args: string[]): CliOptions {
  const promptReviewsDir = path.resolve(process.cwd());
  const projectRoot = path.resolve(promptReviewsDir, "..");
  const dataDir = path.join(promptReviewsDir, "data");
  const parsed: CliOptions = {
    projectRoot,
    promptReviewsDir,
    databasePath: process.env.PROMPT_REVIEWS_DB ?? path.join(dataDir, "prompt_reviews.sqlite"),
    commentsJsonPath: path.join(dataDir, "comments.json"),
    dryRun: true,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") {
      parsed.dryRun = false;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--db") {
      parsed.databasePath = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--comments-json") {
      parsed.commentsJsonPath = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--prompt-reviews-dir") {
      parsed.promptReviewsDir = requireValue(args, index, arg);
      parsed.projectRoot = path.resolve(parsed.promptReviewsDir, "..");
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  parsed.promptReviewsDir = path.resolve(parsed.promptReviewsDir);
  parsed.projectRoot = path.resolve(parsed.projectRoot);
  parsed.databasePath = path.resolve(parsed.databasePath);
  parsed.commentsJsonPath = path.resolve(parsed.commentsJsonPath);
  return parsed;
}

async function findLegacyMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      files.push(...(await findLegacyMarkdownFiles(absolutePath)));
    } else if (entry.name.endsWith(".prompt-review.md")) {
      files.push(absolutePath);
    }
  }
  return files;
}

function mergeReports(target: Pick<LegacyImportReport, "counts" | "warnings">, source: LegacyImportReport): void {
  target.counts.versions += source.counts.versions;
  target.counts.commits += source.counts.commits;
  target.counts.files += source.counts.files;
  target.counts.diffBlocks += source.counts.diffBlocks;
  target.counts.comments += source.counts.comments;
  target.counts.decisions += source.counts.decisions;
  target.counts.plans += source.counts.plans;
  target.counts.skippedDuplicates += source.counts.skippedDuplicates;
  target.warnings.push(...source.warnings);
}

function printReport(report: LegacyImportReport): void {
  console.log(`Legacy import ${report.dryRun ? "dry run" : "apply"} complete.`);
  console.log(JSON.stringify(report.counts, null, 2));
  for (const item of report.warnings) {
    console.warn(`${item.code}: ${item.message}${item.sourcePath === undefined ? "" : ` (${item.sourcePath})`}`);
  }
}

function requireValue(args: string[], index: number, arg: string): string {
  const value = args[index + 1];
  if (value === undefined) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
