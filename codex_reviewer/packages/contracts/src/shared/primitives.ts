import { z } from "zod";

export const NonEmptyStringSchema = z.string().trim().min(1);
export const IdSchema = NonEmptyStringSchema.brand<"Id">();
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export type Id = z.infer<typeof IdSchema>;
