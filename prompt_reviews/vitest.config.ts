import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "web/src"),
      "@domain": path.resolve(__dirname, "src/domain"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts", "web/src/features/review-workspace/model/**/*.test.ts"],
    passWithNoTests: false,
  },
});
