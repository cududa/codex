import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseGitChangedFiles, type GitChangedFile } from "./changeFiles.js";
import { gitLogFormat, parseGitCommitLog, type GitCommit } from "./commitLog.js";

const execFileAsync = promisify(execFile);

export type GitClient = {
  resolveRef: (refOrSha: string) => Promise<string>;
  listCommits: (baseSha: string, targetSha: string) => Promise<GitCommit[]>;
  listChangedFiles: (commitSha: string) => Promise<GitChangedFile[]>;
  getCommitDiff: (commitSha: string) => Promise<string>;
  getFileAtCommit: (commitSha: string, filePath: string) => Promise<string | null>;
};

export function createCommandGitClient(repositoryPath: string): GitClient {
  return {
    resolveRef: async (refOrSha) => {
      const output = await runGit(repositoryPath, ["rev-parse", "--verify", `${refOrSha}^{commit}`]);
      return output.trim();
    },
    listCommits: async (baseSha, targetSha) => {
      const output = await runGit(repositoryPath, [
        "log",
        "--reverse",
        `--format=${gitLogFormat}`,
        `${baseSha}..${targetSha}`,
      ]);
      return parseGitCommitLog(output);
    },
    listChangedFiles: async (commitSha) => {
      const commonArgs = ["diff-tree", "--root", "--no-commit-id", "-r", "-M", "-C"];
      const [nameStatus, numstat, summary] = await Promise.all([
        runGit(repositoryPath, [...commonArgs, "--name-status", commitSha]),
        runGit(repositoryPath, [...commonArgs, "--numstat", commitSha]),
        runGit(repositoryPath, ["show", "--format=", "--summary", "--no-renames", commitSha]),
      ]);
      return parseGitChangedFiles({ nameStatus, numstat, summary });
    },
    getCommitDiff: async (commitSha) =>
      runGit(repositoryPath, ["show", "--format=", "--find-renames", "--find-copies", "--patch", commitSha]),
    getFileAtCommit: async (commitSha, filePath) => {
      try {
        return await runGit(repositoryPath, ["show", `${commitSha}:${filePath}`]);
      } catch (error) {
        if (isMissingPathAtCommit(error)) {
          return null;
        }
        throw error;
      }
    },
  };
}

async function runGit(repositoryPath: string, args: readonly string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", [...args], {
    cwd: repositoryPath,
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

function isMissingPathAtCommit(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 128) {
    return false;
  }
  const stderr = "stderr" in error && typeof error.stderr === "string" ? error.stderr : "";
  return stderr.includes("exists on disk, but not in") || stderr.includes("does not exist in");
}
