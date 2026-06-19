import {
  ConcernAreaSelectionSchema,
  IngestReviewVersionRequestSchema,
  IngestReviewVersionResponseSchema,
  type ConcernAreaSelection,
  type ConcernAreaSlug,
  type IngestReviewVersionRequest,
  type IngestReviewVersionResponse,
  type ReviewMark,
  type ReviewVersionRead,
} from "@prompt-reviews/contracts";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { ReviewDatabase } from "../db/client.js";
import {
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewFiles,
  reviewVersionIngests,
  reviewVersions,
} from "../db/schema/index.js";
import { badRequest, stateConflict } from "./errors.js";
import { createGitRangeReader, type GitCommitInput, type GitRangeReader } from "./git-range-reader.js";
import type { ReviewReadStore } from "./read-store.js";

export const deterministicConcernMapVersion = "deterministic-concern-map-v1";

export type ReviewIngestService = {
  ingestReviewVersion: (request: IngestReviewVersionRequest) => Promise<IngestReviewVersionResponse>;
};

export type ReviewIngestServiceOptions = {
  gitRangeReader?: GitRangeReader;
};

export function createReviewIngestService(
  db: ReviewDatabase,
  readStore: ReviewReadStore,
  options: ReviewIngestServiceOptions = {},
): ReviewIngestService {
  const gitRangeReader = options.gitRangeReader ?? createGitRangeReader();

  return {
    async ingestReviewVersion(request) {
      const payload = IngestReviewVersionRequestSchema.parse(request);
      if (payload.concernMapVersion !== deterministicConcernMapVersion) {
        throw badRequest(`Unsupported concern map version: ${payload.concernMapVersion}`);
      }

      const baseSha = await gitRangeReader.resolveCommit(payload.baseRefOrSha);
      const targetSha = await gitRangeReader.resolveCommit(payload.targetRefOrSha);
      if (baseSha === null) {
        throw badRequest(`Unable to resolve base ref or SHA: ${payload.baseRefOrSha}`);
      }
      if (targetSha === null) {
        throw badRequest(`Unable to resolve target ref or SHA: ${payload.targetRefOrSha}`);
      }

      const existing = await findVersionByResolvedRange(
        db,
        readStore,
        payload.repositoryId,
        baseSha,
        targetSha,
      );
      if (existing !== null) {
        return IngestReviewVersionResponseSchema.parse({ version: existing, created: false });
      }

      const commits = await gitRangeReader.listCommits(baseSha, targetSha);
      const versionId = await db.transaction(async (tx) => {
        const createdAt = new Date().toISOString();
        const id = randomUUID();
        const label =
          payload.label ?? `${payload.repositoryId} ${shortSha(baseSha)}..${shortSha(targetSha)}`;

        await tx.insert(reviewVersions).values({
          id,
          label,
          repositoryId: payload.repositoryId,
          baseRef: payload.baseRefOrSha,
          targetRef: payload.targetRefOrSha,
          baseSha,
          targetSha,
          createdAt,
        });
        await tx.insert(reviewVersionIngests).values({
          versionId: id,
          repositoryId: payload.repositoryId,
          baseRefOrSha: payload.baseRefOrSha,
          targetRefOrSha: payload.targetRefOrSha,
          baseSha,
          targetSha,
          concernMapVersion: payload.concernMapVersion,
          source: payload.source,
          createdAt,
        });

        for (const [commitPosition, commit] of commits.entries()) {
          const concernAreas = selectConcernAreas(commit);
          const reviewMark = initialCommitReviewMark(concernAreas);
          const commitId = randomUUID();
          await tx.insert(reviewCommits).values({
            id: commitId,
            versionId: id,
            sha: commit.sha,
            position: commitPosition,
            title: commit.title,
            message: commit.message,
            authorName: commit.authorName,
            committedAt: commit.committedAt,
            reviewMark,
            createdAt,
          });

          if (concernAreas.length > 0) {
            await tx.insert(commitConcernAreas).values(
              concernAreas.map((concernAreaSlug, position) => ({
                commitId,
                concernAreaSlug,
                position,
              })),
            );
          }

          const files = orderedFiles(commit.files);
          for (const [filePosition, file] of files.entries()) {
            const fileReviewMark = initialFileReviewMark(reviewMark);
            const fileId = randomUUID();
            await tx.insert(reviewFiles).values({
              id: fileId,
              commitId,
              position: filePosition,
              path: file.path,
              oldPath: file.oldPath,
              changeKind: file.changeKind,
              reviewMark: fileReviewMark,
              createdAt,
            });

            const blocks = parseDiffBlocks(file.patch);
            if (blocks.length > 0) {
              await tx.insert(diffBlocks).values(
                blocks.map((block, position) => ({
                  id: randomUUID(),
                  fileId,
                  position,
                  ...block,
                })),
              );
            }
          }
        }

        return id;
      });

      const version = await readStore.getReviewVersion(versionId);
      if (version === null) {
        throw stateConflict(`Ingested review version not found after creation: ${versionId}`);
      }

      return IngestReviewVersionResponseSchema.parse({ version, created: true });
    },
  };
}

async function findVersionByResolvedRange(
  db: ReviewDatabase,
  readStore: ReviewReadStore,
  repositoryId: string,
  baseSha: string,
  targetSha: string,
): Promise<ReviewVersionRead | null> {
  const [version] = await db
    .select({ id: reviewVersions.id })
    .from(reviewVersions)
    .where(
      and(
        eq(reviewVersions.repositoryId, repositoryId),
        eq(reviewVersions.baseSha, baseSha),
        eq(reviewVersions.targetSha, targetSha),
      ),
    )
    .limit(1);

  if (version === undefined) {
    return null;
  }

  return readStore.getReviewVersion(version.id);
}

type DiffBlockInput = {
  heading: string | null;
  oldStartLine: number | null;
  oldEndLine: number | null;
  newStartLine: number | null;
  newEndLine: number | null;
  patch: string;
};

type ConcernRule = {
  slug: ConcernAreaSlug;
  patterns: RegExp[];
};

const concernRules: ConcernRule[] = [
  {
    slug: "harness-prompts",
    patterns: [/prompt/i, /instruction/i, /system message/i, /developer message/i, /base[_ -]instructions?/i],
  },
  {
    slug: "message-roles",
    patterns: [/message role/i, /role boundary/i, /transcript item/i, /message conversion/i, /\brole\b/i],
  },
  {
    slug: "hidden-context",
    patterns: [/hidden context/i, /injected context/i, /implicit context/i, /summary context/i],
  },
  {
    slug: "context-compaction",
    patterns: [/compaction/i, /compact/i, /truncation/i, /summari[sz]ation/i, /context recovery/i],
  },
  {
    slug: "goal-continuation",
    patterns: [/continuation/i, /resume/i, /resumption/i, /budget/i, /active goal/i],
  },
  {
    slug: "goal-behavior",
    patterns: [/goal creation/i, /goal update/i, /goal completion/i, /blocked goal/i, /\bgoal\b/i],
  },
  {
    slug: "tool-affordances",
    patterns: [/tool schema/i, /tool description/i, /mcp tool/i, /tool routing/i, /command execution/i, /\btool\b/i],
  },
  {
    slug: "permission-defaults",
    patterns: [/sandbox/i, /approval/i, /trust/i, /permission/i, /policy gate/i],
  },
];

function selectConcernAreas(commit: GitCommitInput): ConcernAreaSelection {
  const haystack = [
    commit.title,
    commit.message ?? "",
    ...commit.files.flatMap((file) => [file.path, file.oldPath ?? "", file.patch]),
  ].join("\n");
  const selected = concernRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(haystack)))
    .map((rule) => rule.slug)
    .slice(0, 3);
  return ConcernAreaSelectionSchema.parse(selected);
}

function initialCommitReviewMark(concernAreas: ConcernAreaSelection): ReviewMark {
  return concernAreas.length > 0 ? "FLAG" : "PASS";
}

function initialFileReviewMark(_commitReviewMark: ReviewMark): ReviewMark | null {
  return null;
}

function orderedFiles(files: GitCommitInput["files"]): GitCommitInput["files"] {
  return files;
}

function parseDiffBlocks(filePatch: string): DiffBlockInput[] {
  const lines = filePatch.split("\n");
  const blocks: DiffBlockInput[] = [];
  let current: string[] = [];
  let currentRange: Omit<DiffBlockInput, "patch"> | null = null;

  for (const line of lines) {
    const range = parseHunkHeader(line);
    if (range !== null) {
      if (currentRange !== null) {
        blocks.push({ ...currentRange, patch: current.join("\n").trimEnd() });
      }
      currentRange = range;
      current = [line];
    } else if (currentRange !== null) {
      current.push(line);
    }
  }

  if (currentRange !== null) {
    blocks.push({ ...currentRange, patch: current.join("\n").trimEnd() });
  }

  return blocks;
}

function parseHunkHeader(line: string): Omit<DiffBlockInput, "patch"> | null {
  const match = /^@@ -(?<oldStart>\d+)(?:,(?<oldCount>\d+))? \+(?<newStart>\d+)(?:,(?<newCount>\d+))? @@ ?(?<heading>.*)$/.exec(
    line,
  );
  if (match?.groups === undefined) {
    return null;
  }

  const oldStart = Number.parseInt(match.groups.oldStart ?? "0", 10);
  const oldCount = Number.parseInt(match.groups.oldCount ?? "1", 10);
  const newStart = Number.parseInt(match.groups.newStart ?? "0", 10);
  const newCount = Number.parseInt(match.groups.newCount ?? "1", 10);
  const heading = match.groups.heading ?? "";

  return {
    heading: heading.length > 0 ? heading : null,
    oldStartLine: oldCount === 0 ? null : oldStart,
    oldEndLine: oldCount === 0 ? null : oldStart + oldCount - 1,
    newStartLine: newCount === 0 ? null : newStart,
    newEndLine: newCount === 0 ? null : newStart + newCount - 1,
  };
}

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}
