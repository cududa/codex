import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ChangeKind } from "@prompt-reviews/contracts";

const execFileAsync = promisify(execFile);

export type GitCommitInput = {
  sha: string;
  title: string;
  message: string | null;
  authorName: string | null;
  committedAt: string | null;
  files: GitFileInput[];
};

export type GitFileInput = {
  path: string;
  oldPath: string | null;
  changeKind: ChangeKind;
  patch: string;
};

export type GitRangeReader = {
  resolveCommit: (refOrSha: string) => Promise<string | null>;
  listCommits: (baseSha: string, targetSha: string) => Promise<GitCommitInput[]>;
};

export function createGitRangeReader(repositoryRoot = process.cwd()): GitRangeReader {
  return {
    async resolveCommit(refOrSha) {
      try {
        return (await git(repositoryRoot, ["rev-parse", "--verify", `${refOrSha}^{commit}`])).trim();
      } catch {
        return null;
      }
    },

    async listCommits(baseSha, targetSha) {
      const revList = await git(repositoryRoot, ["rev-list", "--reverse", `${baseSha}..${targetSha}`]);
      const shas = revList
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const commits: GitCommitInput[] = [];
      for (const sha of shas) {
        commits.push(await readCommit(repositoryRoot, sha));
      }
      return commits;
    },
  };
}

async function readCommit(repositoryRoot: string, sha: string): Promise<GitCommitInput> {
  const metadata = await git(repositoryRoot, ["show", "-s", "--format=%H%x00%s%x00%B%x00%an%x00%cI", sha]);
  const [resolvedSha, title, rawMessage, authorName, committedAt] = metadata.split("\0");
  const trimmedMessage = rawMessage?.trim() ?? "";
  const message = trimmedMessage.length === 0 ? null : trimmedMessage;
  const patch = await git(repositoryRoot, [
    "show",
    "--format=",
    "--find-renames",
    "--find-copies",
    "--patch",
    "--no-ext-diff",
    "--no-color",
    sha,
  ]);

  return {
    sha: resolvedSha?.trim() || sha,
    title: title?.trim() || sha,
    message,
    authorName: nullWhenBlank(authorName),
    committedAt: nullWhenBlank(committedAt),
    files: parseGitPatch(patch),
  };
}

function parseGitPatch(patch: string): GitFileInput[] {
  const filePatches = splitFilePatches(patch);
  return filePatches.map(parseFilePatch).filter((file): file is GitFileInput => file !== null);
}

function splitFilePatches(patch: string): string[] {
  const lines = patch.split("\n");
  const patches: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git ") && current.length > 0) {
      patches.push(current.join("\n").trimEnd());
      current = [line];
    } else if (line.startsWith("diff --git ") || current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    patches.push(current.join("\n").trimEnd());
  }

  return patches;
}

function parseFilePatch(patch: string): GitFileInput | null {
  const lines = patch.split("\n");
  const header = lines[0];
  const headerMatch = /^diff --git a\/(.+) b\/(.+)$/.exec(header ?? "");
  if (headerMatch === null) {
    return null;
  }

  const oldHeaderPath = headerMatch[1] ?? "";
  const newHeaderPath = headerMatch[2] ?? "";
  const renameFrom = prefixedValue(lines, "rename from ");
  const renameTo = prefixedValue(lines, "rename to ");
  const copyFrom = prefixedValue(lines, "copy from ");
  const copyTo = prefixedValue(lines, "copy to ");
  const isAdded = lines.some((line) => line === "new file mode" || line.startsWith("new file mode "));
  const isDeleted = lines.some((line) => line === "deleted file mode" || line.startsWith("deleted file mode "));
  const hasModeChange =
    lines.some((line) => line.startsWith("old mode ")) && lines.some((line) => line.startsWith("new mode "));

  if (renameFrom !== null && renameTo !== null) {
    return { path: renameTo, oldPath: renameFrom, changeKind: "renamed", patch };
  }

  if (copyFrom !== null && copyTo !== null) {
    return { path: copyTo, oldPath: copyFrom, changeKind: "copied", patch };
  }

  if (isAdded) {
    return { path: newHeaderPath, oldPath: null, changeKind: "added", patch };
  }

  if (isDeleted) {
    return { path: oldHeaderPath, oldPath: null, changeKind: "deleted", patch };
  }

  if (hasModeChange && !patch.includes("\n@@ ")) {
    return { path: newHeaderPath, oldPath: null, changeKind: "modeChanged", patch };
  }

  return { path: newHeaderPath, oldPath: null, changeKind: "modified", patch };
}

function prefixedValue(lines: string[], prefix: string): string | null {
  const line = lines.find((candidate) => candidate.startsWith(prefix));
  return line === undefined ? null : line.slice(prefix.length).trim();
}

function nullWhenBlank(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? null : trimmed;
}

async function git(repositoryRoot: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", repositoryRoot, ...args], {
    maxBuffer: 1024 * 1024 * 64,
  });
  return stdout;
}
