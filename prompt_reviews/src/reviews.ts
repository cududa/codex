import { execFile } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { Workspace } from "./workspace.js";

const execFileAsync = promisify(execFile);
const schema = "prompt-review/v2";
export const reviewModes = ["added-only", "deleted-only", "changed"] as const;
export type ReviewMode = (typeof reviewModes)[number];

export type ReviewTargetInput = {
  name: string;
  path: string;
  startLine?: number;
  endLine?: number;
};

export type ReviewOutput = {
  name: string;
  path: string;
  reviewPath: string;
  bundle?: string;
  mode: ReviewMode;
  persisted: boolean;
  bytes: number;
};

type CommitInfo = {
  sha: string;
  shortSha: string;
  parentSha: string;
  subject: string;
};

type ReviewBlock = {
  kind: "same" | "change";
  id: string;
  beforeStart?: number;
  beforeEnd?: number;
  afterStart?: number;
  afterEnd?: number;
  beforeLines: string[];
  afterLines: string[];
};

type OpCode = {
  tag: "equal" | "delete" | "insert" | "replace";
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
};

export async function createReviews(input: {
  workspace: Workspace;
  artifactRoot: string;
  commit: string;
  bundle?: string;
  targets: ReviewTargetInput[];
}): Promise<{ commit: CommitInfo; outputs: ReviewOutput[] }> {
  if (input.targets.length === 0) {
    throw new Error("At least one target is required.");
  }

  const commit = await getCommitInfo(input.workspace.root, input.commit);
  const bundle = input.bundle === undefined ? undefined : normalizeBundleName(input.bundle);
  if (input.bundle !== undefined && bundle === "") {
    throw new Error("bundle must contain at least one filename-safe character.");
  }

  const commitDir =
    bundle === undefined ? path.join(input.artifactRoot, commit.shortSha) : path.join(input.artifactRoot, bundle, commit.shortSha);
  await mkdir(commitDir, { recursive: true });

  const outputs: ReviewOutput[] = [];
  for (const target of input.targets) {
    validateTarget(target);
    const before = await gitShowText(input.workspace.root, commit.parentSha, target.path);
    const after = await gitShowText(input.workspace.root, commit.sha, target.path);
    if (before === null && after === null) {
      throw new Error(`Target path not found before or after commit: ${target.path}`);
    }

    const mode = reviewMode(before, after);
    const beforeLines = selectedLines(before ?? "", target);
    const afterLines = selectedLines(after ?? "", target);
    const lineOffset = (target.startLine ?? 1) - 1;
    const blocks = diffBlocks(beforeLines, afterLines, lineOffset);
    const fileName = `${slugify(target.name)}.prompt-review.md`;
    const absoluteReviewPath = path.join(commitDir, fileName);
    const reviewText = renderReview(commit, target, blocks, mode, bundle);

    await writeFile(absoluteReviewPath, reviewText, "utf8");
    const fileStat = await stat(absoluteReviewPath);
    outputs.push({
      name: target.name,
      path: target.path,
      reviewPath: path.relative(input.workspace.root, absoluteReviewPath).replaceAll("\\", "/"),
      ...(bundle === undefined ? {} : { bundle }),
      mode,
      persisted: true,
      bytes: fileStat.size,
    });
  }

  return { commit, outputs };
}

export function parseTargetSpec(spec: string): ReviewTargetInput {
  const separator = spec.indexOf("=");
  if (separator === -1) {
    throw new Error(`target must be name=path or name=path:start-end: ${spec}`);
  }

  const name = spec.slice(0, separator).trim();
  const location = spec.slice(separator + 1).trim();
  if (name.length === 0) {
    throw new Error(`target name is empty: ${spec}`);
  }
  if (location.length === 0) {
    throw new Error(`target path is empty: ${spec}`);
  }

  const match = /:(\d+)(?:-(\d+))?$/.exec(location);
  if (match === null) {
    return { name, path: normalizeRepoPath(location) };
  }

  const startLine = Number(match[1]);
  const endLine = Number(match[2] ?? match[1]);
  if (endLine < startLine) {
    throw new Error(`target line range ends before it starts: ${spec}`);
  }

  return {
    name,
    path: normalizeRepoPath(location.slice(0, match.index)),
    startLine,
    endLine,
  };
}

export function normalizeBundleName(value: string): string {
  return slugify(value);
}

function validateTarget(target: ReviewTargetInput): void {
  if (target.name.trim().length === 0) {
    throw new Error("target name must not be empty.");
  }
  if (target.path.trim().length === 0) {
    throw new Error(`target path must not be empty for ${target.name}.`);
  }
  if (
    target.startLine !== undefined &&
    target.endLine !== undefined &&
    target.endLine < target.startLine
  ) {
    throw new Error(`target ${target.name} has an endLine before startLine.`);
  }
}

function selectedLines(text: string, target: ReviewTargetInput): string[] {
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  if (target.startLine === undefined) {
    return lines;
  }

  const startIndex = Math.max(target.startLine - 1, 0);
  const endIndex = Math.min(target.endLine ?? target.startLine, lines.length);
  return lines.slice(startIndex, endIndex);
}

function diffBlocks(before: string[], after: string[], lineOffset: number): ReviewBlock[] {
  const opcodes = buildOpcodes(before, after);
  let sameCount = 0;
  let changeCount = 0;

  return opcodes.map((opcode) => {
    const same = opcode.tag === "equal";
    if (same) {
      sameCount += 1;
    } else {
      changeCount += 1;
    }

    return {
      kind: same ? "same" : "change",
      id: same ? `same-${sameCount.toString().padStart(3, "0")}` : `change-${changeCount.toString().padStart(3, "0")}`,
      beforeStart: lineNumberOrUndefined(opcode.beforeStart, opcode.beforeEnd, lineOffset),
      beforeEnd: lineNumberOrUndefined(opcode.beforeEnd - 1, opcode.beforeEnd, lineOffset),
      afterStart: lineNumberOrUndefined(opcode.afterStart, opcode.afterEnd, lineOffset),
      afterEnd: lineNumberOrUndefined(opcode.afterEnd - 1, opcode.afterEnd, lineOffset),
      beforeLines: before.slice(opcode.beforeStart, opcode.beforeEnd),
      afterLines: after.slice(opcode.afterStart, opcode.afterEnd),
    };
  });
}

function buildOpcodes(before: string[], after: string[]): OpCode[] {
  const table = Array.from({ length: before.length + 1 }, () =>
    Array<number>(after.length + 1).fill(0),
  );

  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const ops: Array<{ tag: "equal" | "delete" | "insert"; beforeIndex: number; afterIndex: number }> =
    [];
  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < before.length && afterIndex < after.length) {
    if (before[beforeIndex] === after[afterIndex]) {
      ops.push({ tag: "equal", beforeIndex, afterIndex });
      beforeIndex += 1;
      afterIndex += 1;
    } else if (table[beforeIndex + 1][afterIndex] >= table[beforeIndex][afterIndex + 1]) {
      ops.push({ tag: "delete", beforeIndex, afterIndex });
      beforeIndex += 1;
    } else {
      ops.push({ tag: "insert", beforeIndex, afterIndex });
      afterIndex += 1;
    }
  }

  while (beforeIndex < before.length) {
    ops.push({ tag: "delete", beforeIndex, afterIndex });
    beforeIndex += 1;
  }
  while (afterIndex < after.length) {
    ops.push({ tag: "insert", beforeIndex, afterIndex });
    afterIndex += 1;
  }

  const grouped: OpCode[] = [];
  for (const op of ops) {
    const last = grouped.at(-1);
    if (last !== undefined && opFits(last, op)) {
      last.beforeEnd = Math.max(last.beforeEnd, op.beforeIndex + (op.tag === "insert" ? 0 : 1));
      last.afterEnd = Math.max(last.afterEnd, op.afterIndex + (op.tag === "delete" ? 0 : 1));
      if (last.tag !== "equal") {
        last.tag = "replace";
      }
    } else {
      grouped.push({
        tag: op.tag,
        beforeStart: op.beforeIndex,
        beforeEnd: op.beforeIndex + (op.tag === "insert" ? 0 : 1),
        afterStart: op.afterIndex,
        afterEnd: op.afterIndex + (op.tag === "delete" ? 0 : 1),
      });
    }
  }

  return grouped;
}

function opFits(
  opcode: OpCode,
  op: { tag: "equal" | "delete" | "insert"; beforeIndex: number; afterIndex: number },
): boolean {
  if (opcode.tag === "equal") {
    return op.tag === "equal" && opcode.beforeEnd === op.beforeIndex && opcode.afterEnd === op.afterIndex;
  }
  return op.tag !== "equal" && opcode.beforeEnd === op.beforeIndex && opcode.afterEnd === op.afterIndex;
}

function renderReview(
  commit: CommitInfo,
  target: ReviewTargetInput,
  blocks: ReviewBlock[],
  mode: ReviewMode,
  bundle?: string,
): string {
  const lines = [
    "---",
    `schema: ${schema}`,
    `commit: ${commit.sha}`,
    `parent: ${commit.parentSha}`,
    `shortCommit: ${commit.shortSha}`,
    `subject: ${yamlScalar(commit.subject)}`,
    `target: ${yamlScalar(target.name)}`,
    `mode: ${mode}`,
    "source:",
    `  before: ${commit.parentSha}:${target.path}`,
    `  after: ${commit.sha}:${target.path}`,
  ];

  if (bundle !== undefined) {
    lines.push(`bundle: ${yamlScalar(bundle)}`);
  }

  if (target.startLine !== undefined) {
    lines.push("selection:", `  startLine: ${target.startLine}`, `  endLine: ${target.endLine ?? target.startLine}`);
  }

  lines.push("---", "", `# ${target.name}`, "");

  for (const block of blocks) {
    lines.push(...renderBlock(block));
  }

  lines.push(
    "## Comments",
    "",
    "<!-- Comments are stored by the prompt_reviews app. Select exact text in this generated review and add a comment. -->",
    "",
  );
  return `${lines.join("\n")}`;
}

function renderBlock(block: ReviewBlock): string[] {
  const title = block.kind === "same" ? "Same" : "Changed";
  const lines = [
    `## ${title} \`${block.id}\``,
    "",
    "<!--",
    `id: ${block.id}`,
    `kind: ${block.kind}`,
    `beforeLines: ${rangeForDisplay(block.beforeStart, block.beforeEnd)}`,
    `afterLines: ${rangeForDisplay(block.afterStart, block.afterEnd)}`,
    "-->",
    "",
  ];

  if (block.kind === "same") {
    const fence = fenceFor(block.beforeLines);
    lines.push(`${fence}text id=${block.id} side=both`, ...block.beforeLines, fence, "");
    return lines;
  }

  const diffLines = block.beforeLines.map((line) => `- ${line}`);
  diffLines.push(...block.afterLines.map((line) => `+ ${line}`));
  const fence = fenceFor(diffLines);
  lines.push(`${fence}diff id=${block.id}`, ...diffLines, fence, "");
  return lines;
}

function lineNumberOrUndefined(index: number, end: number, lineOffset: number): number | undefined {
  if (end <= index) {
    return undefined;
  }
  return index + lineOffset + 1;
}

async function getCommitInfo(repoRoot: string, commitish: string): Promise<CommitInfo> {
  const sha = (await runGit(repoRoot, ["rev-parse", commitish])).trim();
  const parents = (await runGit(repoRoot, ["rev-list", "--parents", "-n", "1", sha])).trim().split(/\s+/);
  if (parents.length < 2) {
    throw new Error(`${sha} has no parent; nothing to compare.`);
  }
  const subject = (await runGit(repoRoot, ["show", "-s", "--format=%s", sha])).trim();
  const shortSha = (await runGit(repoRoot, ["rev-parse", "--short=10", sha])).trim();
  return { sha, shortSha, parentSha: parents[1], subject };
}

async function gitShowText(repoRoot: string, commit: string, repoPath: string): Promise<string | null> {
  try {
    return await runGit(repoRoot, ["show", `${commit}:${normalizeRepoPath(repoPath)}`]);
  } catch {
    return null;
  }
}

async function runGit(repoRoot: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

function normalizeRepoPath(value: string): string {
  return value.trim().replaceAll("\\", "/");
}

function yamlScalar(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function fenceFor(lines: string[]): string {
  let longest = 2;
  for (const line of lines) {
    for (const match of line.matchAll(/`+/g)) {
      longest = Math.max(longest, match[0].length);
    }
  }
  return "`".repeat(longest + 1);
}

function rangeForDisplay(start?: number, end?: number): string {
  if (start === undefined || end === undefined) {
    return "none";
  }
  return start === end ? String(start) : `${start}-${end}`;
}

function reviewMode(before: string | null, after: string | null): ReviewMode {
  if (before === null) {
    return "added-only";
  }
  if (after === null) {
    return "deleted-only";
  }
  return "changed";
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .replaceAll(/[^A-Za-z0-9_.-]+/g, "-")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/(^[-._]+|[-._]+$)/g, "");
  return (slug || "prompt").slice(0, 80);
}
