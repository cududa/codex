import { readdir } from "node:fs/promises";
import path from "node:path";

export async function listReviewFiles(promptReviewsDir: string): Promise<string[]> {
  const entries = await readdir(promptReviewsDir, { withFileTypes: true });
  const reviewFiles: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[0-9a-f]{10,40}$/.test(entry.name)) {
      continue;
    }

    const dir = path.join(promptReviewsDir, entry.name);
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".prompt-review.md")) {
        reviewFiles.push(
          path.join("prompt_reviews", entry.name, file.name).replaceAll("\\", "/"),
        );
      }
    }
  }

  return reviewFiles.sort();
}
