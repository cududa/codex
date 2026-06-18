import { describe, expect, it } from "vitest";
import { concernAreas, reviewMarkDefinitions } from "@prompt-reviews/contracts";
import {
  changeSymbol,
  changeTone,
  concernAreaSummary,
  reviewMarkLabel,
  reviewMarkTone,
} from "./workbenchView";

describe("workbench view helpers", () => {
  it("summarizes ordered concern areas without old primary/secondary vocabulary", () => {
    expect(concernAreaSummary(["tool-affordances"], concernAreas)).toBe("Tool Affordances");
    expect(
      concernAreaSummary(["tool-affordances", "permission-defaults", "hidden-context"], concernAreas),
    ).toBe("Tool Affordances +2");
  });

  it("maps review marks to display labels and tones", () => {
    expect(reviewMarkLabel("PASS", reviewMarkDefinitions)).toBe("Pass");
    expect(reviewMarkLabel(null, reviewMarkDefinitions)).toBe("No file mark");
    expect(reviewMarkTone("MODIFY")).toBe("modify");
    expect(reviewMarkTone("FLAG")).toBe("flag");
    expect(reviewMarkTone(null)).toBe("unset");
  });

  it("uses compact file change symbols", () => {
    expect(changeSymbol("added")).toBe("+");
    expect(changeTone("added")).toBe("add");
    expect(changeSymbol("modified")).toBe("/");
    expect(changeTone("modified")).toBe("modify");
    expect(changeSymbol("deleted")).toBe("-");
    expect(changeTone("deleted")).toBe("delete");
  });
});
