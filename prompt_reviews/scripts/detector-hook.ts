import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkPostCommitHook,
  installPostCommitHook,
  postCommitRefreshSkipEnvVar,
} from "../src/automation/postCommitHook.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  const { command, repo } = parseArgs(process.argv.slice(2));
  const options = { repositoryPath: repo, promptReviewsPath: projectRoot };
  const status = command === "install" ? await installPostCommitHook(options) : await checkPostCommitHook(options);
  const state = status.installed ? "installed" : "missing";
  const mode = status.executable ? "executable" : "not executable";
  console.log(`prompt_reviews post-commit hook ${state} (${mode}): ${status.hookPath}`);
  console.log(`Set ${postCommitRefreshSkipEnvVar}=1 to skip refresh execution.`);
  if (command === "check" && (!status.installed || !status.executable)) {
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { command: "check" | "install"; repo: string } {
  const command = argv[0];
  if (command !== "check" && command !== "install") {
    printHelp();
    process.exit(command === "--help" ? 0 : 1);
  }
  const repoIndex = argv.indexOf("--repo");
  return {
    command,
    repo: path.resolve(repoIndex === -1 ? path.resolve(projectRoot, "..") : argv[repoIndex + 1] ?? ""),
  };
}

function printHelp(): void {
  console.log(`Usage: tsx scripts/detector-hook.ts <check|install> [--repo <path>]

Installs or checks the managed post-commit graph refresh block.
Existing hook content is preserved and the managed block is replaced idempotently.
Set ${postCommitRefreshSkipEnvVar}=1 to skip refresh execution.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
