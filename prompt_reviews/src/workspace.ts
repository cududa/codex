import { readFile } from "node:fs/promises";
import path from "node:path";

export class Workspace {
  readonly root: string;

  constructor(promptReviewsDir: string) {
    this.root = path.resolve(promptReviewsDir, "..");
  }

  resolveFile(filePath: string): { relativePath: string; absolutePath: string } {
    const normalized = filePath.replaceAll("\\", "/");
    const absolutePath = path.resolve(this.root, normalized);
    const relativePath = path.relative(this.root, absolutePath).replaceAll("\\", "/");

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error("filePath must stay inside the workspace.");
    }

    return { relativePath, absolutePath };
  }

  async readTextFile(filePath: string): Promise<{ relativePath: string; text: string }> {
    const resolved = this.resolveFile(filePath);
    return {
      relativePath: resolved.relativePath,
      text: await readFile(resolved.absolutePath, "utf8"),
    };
  }
}
