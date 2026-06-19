import { z } from "zod";
import { IdSchema } from "../shared/primitives.js";

export const ReviewEventTargetSchema = z
  .object({
    type: z.enum(["version", "commit", "file", "diffBlock"]),
    id: IdSchema,
  })
  .strict()
  .describe("Review event payload target.");

export type ReviewEventTarget = z.infer<typeof ReviewEventTargetSchema>;
