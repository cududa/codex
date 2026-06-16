import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPromptReviewsDatabase } from "../src/db/client.js";
import { migratePromptReviewsDatabase } from "../src/db/migrate.js";
import { postCommitRefreshSkipEnvVar } from "../src/automation/postCommitHook.js";
import { runPostCommitRefresh } from "../src/detector/postCommit/postCommitRefresh.js";
import { createCommandGitClient } from "../src/git/gitClient.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  if (process.env[postCommitRefreshSkipEnvVar] === "1") {
    console.log(`prompt_reviews post-commit refresh skipped (${postCommitRefreshSkipEnvVar}=1).`);
    return;
  }

  const args = parseArgs(process.argv.slice(2));
  const dbPath = process.env.PROMPT_REVIEWS_DB ?? path.join(projectRoot, "data", "prompt_reviews.sqlite");
  const database = openPromptReviewsDatabase(dbPath);
  try {
    migratePromptReviewsDatabase(database, { migrationsFolder: path.join(projectRoot, "drizzle") });
    const summary = await runPostCommitRefresh({
      db: database.db,
      gitClient: createCommandGitClient(args.repo),
      repositoryId: args.repositoryId,
      commitRef: args.commit,
    });
    console.log(
      `prompt_reviews post-commit refresh ${summary.commitSha.slice(0, 12)}: ${summary.graphNodeCount} graph nodes, ${summary.graphEdgeCount} graph edges, ${summary.findingCount} findings.`,
    );
  } finally {
    database.close();
  }
}

function parseArgs(argv: string[]): { repo: string; commit: string; repositoryId: string } {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help") {
      printHelp();
      process.exit(0);
    }
    if (value?.startsWith("--") !== true) {
      throw new Error(`Unexpected argument: ${value}`);
    }
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      throw new Error(`Missing value for ${value}`);
    }
    args.set(value.slice(2), next);
    index += 1;
  }

  return {
    repo: path.resolve(args.get("repo") ?? path.resolve(projectRoot, "..")),
    commit: args.get("commit") ?? "HEAD",
    repositoryId: args.get("repository-id") ?? "codex-pinned",
  };
}

function printHelp(): void {
  console.log(`Usage: npm run detector:post-commit-refresh -- [--repo <path>] [--commit <ref>] [--repository-id <id>]

Refreshes prompt_reviews concern graph rows for changed files at a local commit.
No detector findings are created by default.

Environment:
  PROMPT_REVIEWS_DB                         Override the sqlite database path.
  ${postCommitRefreshSkipEnvVar}=1          Skip hook/script execution.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
