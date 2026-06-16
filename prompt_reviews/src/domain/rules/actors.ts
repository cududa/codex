import { actorTypes, type ActorType } from "../enums.js";

export type FinalizerActor = {
  type: ActorType;
};

export class HumanFinalizerRequiredError extends Error {
  constructor(actorType: ActorType) {
    super(`Finalization requires a human actor; received ${actorType}.`);
    this.name = "HumanFinalizerRequiredError";
  }
}

export function assertHumanFinalizer(actor: FinalizerActor): asserts actor is FinalizerActor & { type: "human" } {
  if (!actorTypes.includes(actor.type)) {
    throw new HumanFinalizerRequiredError(actor.type);
  }

  if (actor.type !== "human") {
    throw new HumanFinalizerRequiredError(actor.type);
  }
}
