import { z } from "zod";
import { VersionSummarySchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const ListVersionsInputSchema = z
  .object({
    status: z.enum(["open", "closed", "all"]).optional().default("open"),
  })
  .strict();

export const ListVersionsToolOutputSchema = z
  .object({
    versions: z.array(VersionSummarySchema),
    nextAction: NextActionSchema,
  })
  .strict();

export const listVersionsTool = {
  name: "list_versions",
  title: "List review versions",
  description: "List structured review versions available for queue review.",
  inputSchema: ListVersionsInputSchema,
  outputSchema: ListVersionsToolOutputSchema,
  handler(context, input) {
    const versions = context.read.listVersions(input);
    return {
      versions,
      nextAction: {
        resource: versions[0] === undefined ? "prompt-reviews://concern-tags" : `prompt-reviews://version/${versions[0].id}`,
        description:
          versions[0] === undefined
            ? "Inspect concern tags before populating a new version."
            : "Open a version detail resource or list its remaining commits.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ListVersionsInputSchema._output, typeof ListVersionsToolOutputSchema._output>;
