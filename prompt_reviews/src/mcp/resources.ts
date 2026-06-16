import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PromptReviewMcpContext } from "./server.js";
import { resourceJson } from "./format.js";

export function registerPromptReviewResources(server: McpServer, context: PromptReviewMcpContext): void {
  server.registerResource(
    "prompt-review-versions",
    "prompt-reviews://versions",
    { title: "Review versions", mimeType: "application/json" },
    (uri) => resourceJson(uri, { versions: context.read.listVersions({ status: "open" }) }),
  );

  server.registerResource(
    "prompt-review-open-comments",
    "prompt-reviews://comments/open",
    { title: "Open review comments", mimeType: "application/json" },
    (uri) => resourceJson(uri, { comments: context.read.listComments({ status: "open" }) }),
  );

  server.registerResource(
    "prompt-review-concern-tags",
    "prompt-reviews://concern-tags",
    { title: "Concern tags", mimeType: "application/json" },
    (uri) => resourceJson(uri, { tags: context.read.listConcernTags() }),
  );

  registerVersionResources(server, context);
  registerCommitResources(server, context);
  registerFileResources(server, context);
}

function registerVersionResources(server: McpServer, context: PromptReviewMcpContext): void {
  server.registerResource(
    "prompt-review-version",
    versionTemplate("prompt-reviews://version/{versionId}", context),
    { title: "Review version", mimeType: "application/json" },
    (uri, variables) => resourceJson(uri, context.read.getVersionDetail(requiredVariable(variables.versionId))),
  );

  server.registerResource(
    "prompt-review-version-remaining-commits",
    versionTemplate("prompt-reviews://version/{versionId}/remaining-commits", context),
    { title: "Remaining commits", mimeType: "application/json" },
    (uri, variables) =>
      resourceJson(uri, context.queue.listRemainingCommits({ versionId: requiredVariable(variables.versionId) })),
  );

  server.registerResource(
    "prompt-review-missing-decisions",
    versionTemplate("prompt-reviews://decisions/missing/{versionId}", context),
    { title: "Missing decisions", mimeType: "application/json" },
    (uri, variables) => {
      const versionId = requiredVariable(variables.versionId);
      return resourceJson(uri, {
        versionId,
        commits: context.read.listMissingDecisions({ versionId, target: "commit" }).data,
        files: context.read.listMissingDecisions({ versionId, target: "file" }).data,
      });
    },
  );

  server.registerResource(
    "prompt-review-open-plans",
    versionTemplate("prompt-reviews://plans/open/{versionId}", context),
    { title: "Open plans", mimeType: "application/json" },
    (uri, variables) => resourceJson(uri, { plans: context.queue.listOpenPlans({ versionId: requiredVariable(variables.versionId) }) }),
  );
}

function registerCommitResources(server: McpServer, context: PromptReviewMcpContext): void {
  server.registerResource(
    "prompt-review-commit",
    new ResourceTemplate("prompt-reviews://commit/{commitId}", { list: undefined }),
    { title: "Review commit", mimeType: "application/json" },
    (uri, variables) => resourceJson(uri, context.read.getCommitDetail(requiredVariable(variables.commitId))),
  );

  server.registerResource(
    "prompt-review-commit-remaining-files",
    new ResourceTemplate("prompt-reviews://commit/{commitId}/remaining-files", { list: undefined }),
    { title: "Remaining commit files", mimeType: "application/json" },
    (uri, variables) =>
      resourceJson(uri, context.read.listCommitFiles({ commitId: requiredVariable(variables.commitId), remaining: true })),
  );
}

function registerFileResources(server: McpServer, context: PromptReviewMcpContext): void {
  server.registerResource(
    "prompt-review-file",
    new ResourceTemplate("prompt-reviews://file/{commitFileId}", { list: undefined }),
    { title: "Review file", mimeType: "application/json" },
    (uri, variables) => resourceJson(uri, context.read.getCommitFileDetail(requiredVariable(variables.commitFileId))),
  );
}

function versionTemplate(pattern: string, context: PromptReviewMcpContext): ResourceTemplate {
  return new ResourceTemplate(pattern, {
    list: () => ({
      resources: context.read.listVersions({ status: "open" }).map((version) => ({
        uri: pattern.replace("{versionId}", encodeURIComponent(version.id)),
        name: version.id,
        title: version.label,
        mimeType: "application/json",
      })),
    }),
  });
}

function requiredVariable(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join("/");
  }
  if (value === undefined) {
    throw new Error("Missing resource id.");
  }
  return value;
}
