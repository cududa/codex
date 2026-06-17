import { z } from "zod";

export const NonEmptyStringSchema = z.string().trim().min(1).describe("A non-empty string after trimming whitespace.");
export const MarkdownStringSchema = NonEmptyStringSchema.describe("Markdown content supplied by a human or agent.");
export const IdSchema = NonEmptyStringSchema.brand<"Id">().describe("A stable opaque identifier.");
export const IsoDateTimeSchema = z.string().datetime({ offset: true }).describe("An ISO 8601 timestamp with an explicit offset.");
export const GitShaSchema = z
  .string()
  .regex(/^[0-9a-f]{7,64}$/i)
  .describe("A Git commit SHA or unique abbreviated SHA.");
export const NonNegativeIntegerSchema = z.number().int().nonnegative().describe("A non-negative integer count.");
export const PositiveLineNumberSchema = z.number().int().positive().describe("A positive one-based source line number.");
export const JsonRecordSchema = z
  .record(z.string(), z.unknown())
  .describe("A JSON-compatible object for narrowly scoped extension metadata.");

export type Id = z.infer<typeof IdSchema>;
export type GitSha = z.infer<typeof GitShaSchema>;
