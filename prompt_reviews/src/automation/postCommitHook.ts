import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const postCommitRefreshSkipEnvVar = "PROMPT_REVIEWS_SKIP_POST_COMMIT_REFRESH";

const beginMarker = "# BEGIN prompt_reviews post-commit refresh";
const endMarker = "# END prompt_reviews post-commit refresh";

export type PostCommitHookOptions = {
  repositoryPath: string;
  promptReviewsPath?: string;
};

export type PostCommitHookStatus = {
  hookPath: string;
  installed: boolean;
  executable: boolean;
};

export async function checkPostCommitHook(options: PostCommitHookOptions): Promise<PostCommitHookStatus> {
  const hookPath = postCommitHookPath(options.repositoryPath);
  const existing = await readOptionalFile(hookPath);
  return {
    hookPath,
    installed: existing.includes(beginMarker) && existing.includes(endMarker),
    executable: await isExecutable(hookPath),
  };
}

export async function installPostCommitHook(options: PostCommitHookOptions): Promise<PostCommitHookStatus> {
  const hookPath = postCommitHookPath(options.repositoryPath);
  await mkdir(path.dirname(hookPath), { recursive: true });
  const existing = await readOptionalFile(hookPath);
  const next = withManagedBlock(existing, hookBlock(options));
  if (next !== existing) {
    await writeFile(hookPath, next, "utf8");
  }
  await chmod(hookPath, 0o755);
  return checkPostCommitHook(options);
}

export function hookBlock(options: PostCommitHookOptions): string {
  const repositoryPath = shellQuote(path.resolve(options.repositoryPath));
  const promptReviewsPath = shellQuote(path.resolve(options.promptReviewsPath ?? path.join(options.repositoryPath, "prompt_reviews")));
  return `${beginMarker}
if [ "\${${postCommitRefreshSkipEnvVar}:-}" = "1" ]; then
  echo "prompt_reviews post-commit refresh skipped (${postCommitRefreshSkipEnvVar}=1)"
else
  npm --prefix ${promptReviewsPath} run detector:post-commit-refresh -- --repo ${repositoryPath} --commit HEAD
fi
${endMarker}`;
}

function postCommitHookPath(repositoryPath: string): string {
  return path.join(repositoryPath, ".git", "hooks", "post-commit");
}

async function readOptionalFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isNotFound(error)) {
      return "";
    }
    throw error;
  }
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    const mode = (await stat(filePath)).mode;
    return (mode & 0o111) !== 0;
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }
}

function withManagedBlock(existing: string, block: string): string {
  const body = existing.trim().length === 0 ? "#!/bin/sh\n" : ensureShellHeader(existing);
  const pattern = new RegExp(`${escapeRegExp(beginMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`);
  const normalizedBlock = block.endsWith("\n") ? block : `${block}\n`;
  if (pattern.test(body)) {
    return body.replace(pattern, block).replace(/\n*$/, "\n");
  }
  return `${body.replace(/\n*$/, "\n\n")}${normalizedBlock}`;
}

function ensureShellHeader(content: string): string {
  return content.startsWith("#!") ? content : `#!/bin/sh\n${content}`;
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
