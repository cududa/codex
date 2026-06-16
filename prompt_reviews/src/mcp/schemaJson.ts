import { z } from "zod";
import type { BoundaryJsonSchema } from "../domain/jsonSchemas.js";

export function toMcpJsonSchema(schema: z.ZodType): BoundaryJsonSchema {
  return z.toJSONSchema(schema, { reused: "ref" });
}
