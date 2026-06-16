import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export type DiscoveredReview = {
  reviewPath: string;
  commit: string;
  bundle?: string;
  bytes: number;
  persisted: boolean;
};

export async function listReviewFiles(promptReviewsDir: string): Promise<string[]> {
  const reviews = await listReviews(promptReviewsDir);
  return reviews.map((review) => review.reviewPath);
}

export async function listReviews(
  promptReviewsDir: string,
  filter?: { commit?: string; bundle?: string },
): Promise<DiscoveredReview[]> {
  const entries = await readdir(promptReviewsDir, { withFileTypes: true });
  const reviewFiles: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (isCommitDir(entry.name)) {
      reviewFiles.push(...(await listReviewFilesInCommitDir(promptReviewsDir, entry.name)));
      continue;
    }
    if (isIgnoredDir(entry.name)) {
      continue;
    }

    const bundleDir = path.join(promptReviewsDir, entry.name);
    const bundleEntries = await readdir(bundleDir, { withFileTypes: true });
    for (const bundleEntry of bundleEntries) {
      if (bundleEntry.isDirectory() && isCommitDir(bundleEntry.name)) {
        reviewFiles.push(
          ...(await listReviewFilesInCommitDir(promptReviewsDir, bundleEntry.name, entry.name)),
        );
      }
    }
  }

  const reviews = await Promise.all(
    reviewFiles.sort().map(async (reviewPath) => {
      const absolutePath = path.join(path.dirname(promptReviewsDir), reviewPath);
      const fileStat = await stat(absolutePath);
      const metadata = parseReviewPath(reviewPath);
      return {
        reviewPath,
        commit: metadata.commit,
        ...(metadata.bundle === undefined ? {} : { bundle: metadata.bundle }),
        bytes: fileStat.size,
        persisted: true,
      };
    }),
  );

  const bundleFilter = filter?.bundle === undefined ? undefined : normalizeBundleFilter(filter.bundle);
  return reviews.filter((review) => {
    if (filter?.commit !== undefined && !review.commit.startsWith(filter.commit)) {
      return false;
    }
    if (bundleFilter !== undefined && review.bundle !== bundleFilter) {
      return false;
    }
    return true;
  });
}

function isCommitDir(name: string): boolean {
  return /^[0-9a-f]{10,40}$/.test(name);
}

function isIgnoredDir(name: string): boolean {
  return new Set(["data", "dist", "node_modules", "src", "web"]).has(name);
}

function normalizeBundleFilter(value: string): string {
  return value
    .trim()
    .replaceAll(/[^A-Za-z0-9_.-]+/g, "-")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/(^[-._]+|[-._]+$)/g, "")
    .slice(0, 80);
}

async function listReviewFilesInCommitDir(
  promptReviewsDir: string,
  commit: string,
  bundle?: string,
): Promise<string[]> {
  const dir =
    bundle === undefined ? path.join(promptReviewsDir, commit) : path.join(promptReviewsDir, bundle, commit);
  const files = await readdir(dir, { withFileTypes: true });
  const reviewFiles: string[] = [];

  for (const file of files) {
    if (file.isFile() && file.name.endsWith(".prompt-review.md")) {
      reviewFiles.push(
        bundle === undefined
          ? path.join("prompt_reviews", commit, file.name).replaceAll("\\", "/")
          : path.join("prompt_reviews", bundle, commit, file.name).replaceAll("\\", "/"),
      );
    }
  }

  return reviewFiles;
}

function parseReviewPath(reviewPath: string): { commit: string; bundle?: string } {
  const parts = reviewPath.split("/");
  if (parts.length >= 3 && isCommitDir(parts[1])) {
    return { commit: parts[1] };
  }
  if (parts.length >= 4 && isCommitDir(parts[2])) {
    return { bundle: parts[1], commit: parts[2] };
  }
  return { commit: "" };
}
