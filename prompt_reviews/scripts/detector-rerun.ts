import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPromptReviewsDatabase } from "../src/db/client.js";
import { migratePromptReviewsDatabase } from "../src/db/migrate.js";
import { populateNextVersion } from "../src/ingestion/populateNextVersion.js";
import { runPostCommitRefresh } from "../src/detector/postCommit/postCommitRefresh.js";
import { createCommandGitClient } from "../src/git/gitClient.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dbPath = process.env.PROMPT_REVIEWS_DB ?? path.join(projectRoot, "data", "prompt_reviews.sqlite");
  const database = openPromptReviewsDatabase(dbPath);
  const gitClient = createCommandGitClient(args.repo);
  try {
    migratePromptReviewsDatabase(database, { migrationsFolder: path.join(projectRoot, "drizzle") });
    if (args.mode === "populate-next-version") {
      const response = await populateNextVersion(
        database.db,
        {
          repositoryId: args.repositoryId,
          baseRefOrSha: args.base,
          targetRef: args.target,
          label: args.label,
        },
        { gitClient, repositoryPath: args.repo },
      );
      console.log(
        `prompt_reviews detector rerun populated ${response.version.id}: ${response.detector.graphNodeCount} graph nodes, ${response.detector.findingCount} findings.`,
      );
      return;
    }

    const summary = await runPostCommitRefresh({
      db: database.db,
      gitClient,
      repositoryId: args.repositoryId,
      commitRef: args.commit,
    });
    console.log(
      `prompt_reviews detector rerun refreshed ${summary.commitSha.slice(0, 12)}: ${summary.graphNodeCount} graph nodes, ${summary.graphEdgeCount} graph edges, ${summary.findingCount} findings.`,
    );
  } finally {
    database.close();
  }
}

function parseArgs(argv: string[]): {
  mode: "post-commit-refresh" | "populate-next-version";
  repo: string;
  repositoryId: string;
  commit: string;
  base?: string;
  target?: string;
  label?: string;
} {
  if (argv.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    const value = argv[index + 1];
    if (name?.startsWith("--") !== true || value === undefined || value.startsWith("--")) {
      throw new Error(`Invalid argument near ${name ?? "<end>"}`);
    }
    args.set(name.slice(2), value);
    index += 1;
  }

  const mode = args.get("mode") ?? "post-commit-refresh";
  if (mode !== "post-commit-refresh" && mode !== "populate-next-version") {
    throw new Error(`Unsupported rerun mode: ${mode}`);
  }

  return {
    mode,
    repo: path.resolve(args.get("repo") ?? path.resolve(projectRoot, "..")),
    repositoryId: args.get("repository-id") ?? "codex-pinned",
    commit: args.get("commit") ?? "HEAD",
    base: args.get("base"),
    target: args.get("target"),
    label: args.get("label"),
  };
}

function printHelp(): void {
  console.log(`Usage: npm run detector:rerun -- [--mode post-commit-refresh|populate-next-version] [options]

Modes:
  post-commit-refresh   Refresh local graph expansion for --commit without findings.
  populate-next-version Rerun upstream ingestion/detector review via populateNextVersion.

Common options:
  --repo <path>             Git repository path.
  --repository-id <id>      Repository id stored in prompt_reviews.

Post-commit options:
  --commit <ref>            Commit/ref to refresh, defaults to HEAD.

Populate options:
  --base <ref>              Base ref/SHA, when no closed base version exists.
  --target <ref>            Target ref, defaults to upstream/main.
  --label <label>           Version label.

Environment:
  PROMPT_REVIEWS_DB         Override the sqlite database path.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
