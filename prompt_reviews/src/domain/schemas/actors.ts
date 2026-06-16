import { z } from "zod";
import { actorTypes } from "../enums.js";

export const IdSchema = z.string().trim().min(1);
export const SlugSchema = z.string().trim().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
export const NonEmptyTextSchema = z.string().trim().min(1);
export const OptionalTextSchema = z.string().trim().min(1).optional();
export const UnixSecondsSchema = z.number().int().nonnegative();
export const CountSchema = z.number().int().nonnegative();
export const PositiveLineNumberSchema = z.number().int().positive();

export const ActorRefSchema = z
  .object({
    type: z.enum(actorTypes),
    id: IdSchema.optional(),
    displayName: OptionalTextSchema,
  })
  .strict();

export const HumanActorRefSchema = ActorRefSchema.extend({
  type: z.literal(actorTypes[0]),
});

export type ActorRef = z.infer<typeof ActorRefSchema>;
export type HumanActorRef = z.infer<typeof HumanActorRefSchema>;
