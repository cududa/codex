import { Crosshair } from "lucide-react";
import { useState } from "react";
import type { SourceRangeDraft } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";

type SourceRangeSelectorProps = {
  disabled: boolean;
  sourceRange: SourceRangeDraft | null;
  onChange: (range: SourceRangeDraft | null) => void;
};

export function SourceRangeSelector({ disabled, sourceRange, onChange }: SourceRangeSelectorProps) {
  const [side, setSide] = useState<"old" | "new">("new");
  const [startLine, setStartLine] = useState("1");
  const [endLine, setEndLine] = useState("1");
  const [selectedText, setSelectedText] = useState("");

  return (
    <form
      className="grid gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const start = Number.parseInt(startLine, 10);
        const end = Number.parseInt(endLine, 10);
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
          return;
        }
        onChange({ side, startLine: start, endLine: end, selectedText: selectedText.trim() });
      }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <Crosshair className="size-4" aria-hidden="true" />
        Source range anchor
      </div>
      <div className="grid grid-cols-[72px_1fr_1fr_minmax(120px,2fr)_auto] gap-2">
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
          disabled={disabled}
          onChange={(event) => setSide(event.target.value as "old" | "new")}
          value={side}
        >
          <option value="new">new</option>
          <option value="old">old</option>
        </select>
        <input
          aria-label="Start line"
          className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          disabled={disabled}
          min={1}
          onChange={(event) => setStartLine(event.target.value)}
          type="number"
          value={startLine}
        />
        <input
          aria-label="End line"
          className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          disabled={disabled}
          min={1}
          onChange={(event) => setEndLine(event.target.value)}
          type="number"
          value={endLine}
        />
        <input
          className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          disabled={disabled}
          onChange={(event) => setSelectedText(event.target.value)}
          placeholder="Selected text"
          value={selectedText}
        />
        <Button disabled={disabled} type="submit" variant="secondary">
          Set
        </Button>
      </div>
      {sourceRange === null ? null : (
        <div className="text-xs text-slate-500">
          Anchored to {sourceRange.side} lines {sourceRange.startLine}-{sourceRange.endLine}
        </div>
      )}
    </form>
  );
}
