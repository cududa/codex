import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkPostCommitHook,
  hookBlock,
  installPostCommitHook,
  postCommitRefreshSkipEnvVar,
} from "./postCommitHook.js";

let repoPath: string;

beforeEach(async () => {
  repoPath = await mkdtemp(path.join(tmpdir(), "prompt-reviews-hook-"));
  await mkdir(path.join(repoPath, ".git", "hooks"), { recursive: true });
});

afterEach(async () => {
  await rm(repoPath, { force: true, recursive: true });
});

describe("post-commit hook automation", () => {
  it("checks, installs, preserves existing content, and is idempotent", async () => {
    const hookPath = path.join(repoPath, ".git", "hooks", "post-commit");
    await writeFile(hookPath, "#!/bin/sh\necho existing\n", "utf8");

    expect(await checkPostCommitHook({ repositoryPath: repoPath })).toMatchObject({
      installed: false,
      executable: false,
    });

    const installed = await installPostCommitHook({ repositoryPath: repoPath, promptReviewsPath: "/tmp/prompt reviews" });
    const firstContent = await readFile(hookPath, "utf8");
    const reinstalled = await installPostCommitHook({ repositoryPath: repoPath, promptReviewsPath: "/tmp/prompt reviews" });
    const secondContent = await readFile(hookPath, "utf8");

    expect(installed).toMatchObject({ installed: true, executable: true });
    expect(reinstalled).toMatchObject({ installed: true, executable: true });
    expect(firstContent).toBe(secondContent);
    expect(firstContent).toContain("echo existing");
    expect(firstContent).toContain("npm --prefix '/tmp/prompt reviews' run detector:post-commit-refresh");
  });

  it("documents the skip environment variable in the managed hook block", () => {
    const block = hookBlock({ repositoryPath: repoPath, promptReviewsPath: "/tmp/prompt_reviews" });

    expect(block).toContain(postCommitRefreshSkipEnvVar);
    expect(block).toContain(`\${${postCommitRefreshSkipEnvVar}:-}`);
    expect(block).toContain("post-commit refresh skipped");
  });
});
