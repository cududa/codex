import type { ConcernArea, ConcernAreaSlug, ReviewMark, ReviewMarkDefinition } from "@/entities/review/types";

export function reviewMarkTone(mark: ReviewMark | null): "flag" | "modify" | "pass" | "unset" {
  if (mark === null) {
    return "unset";
  }
  if (mark === "FLAG") {
    return "flag";
  }
  if (mark === "MODIFY") {
    return "modify";
  }
  return "pass";
}

export function reviewMarkLabel(mark: ReviewMark | null, definitions: ReviewMarkDefinition[]): string {
  if (mark === null) {
    return "No file mark";
  }
  return definitions.find((definition) => definition.mark === mark)?.label ?? mark;
}

export function concernAreaSummary(slugs: ConcernAreaSlug[], areas: ConcernArea[]): string {
  if (slugs.length === 0) {
    return "No concern area";
  }
  const [first, ...rest] = slugs;
  if (first === undefined) {
    return "No concern area";
  }
  const label = areas.find((area) => area.slug === first)?.label ?? first;
  return rest.length === 0 ? label : `${label} +${rest.length}`;
}

export function changeSymbol(changeKind: string): "+" | "-" | "/" {
  if (changeKind === "deleted") {
    return "-";
  }
  if (changeKind === "modified" || changeKind === "modeChanged") {
    return "/";
  }
  return "+";
}

export function changeTone(changeKind: string): "add" | "delete" | "modify" {
  if (changeKind === "deleted") {
    return "delete";
  }
  if (changeKind === "modified" || changeKind === "modeChanged") {
    return "modify";
  }
  return "add";
}
