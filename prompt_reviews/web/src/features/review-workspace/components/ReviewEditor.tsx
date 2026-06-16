import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { useEffect, useRef } from "react";
import type { TextSelection } from "@/entities/review/types";

type ReviewEditorProps = {
  text: string;
  onSelectionChange: (selection: TextSelection | null) => void;
};

export function ReviewEditor({ text, onSelectionChange }: ReviewEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }

    const state = EditorState.create({
      doc: text,
      extensions: [
        lineNumbers(),
        keymap.of(defaultKeymap),
        markdown(),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.selectionSet) {
            return;
          }
          onSelectionChangeRef.current(selectionFromState(update.state));
        }),
        EditorView.theme({
          "&": {
            backgroundColor: "#ffffff",
          },
          ".cm-content": {
            padding: "16px 0",
          },
          ".cm-gutters": {
            backgroundColor: "#f8fafc",
            borderRight: "1px solid #e2e8f0",
            color: "#64748b",
          },
          ".cm-line": {
            padding: "0 18px",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#e2e8f0",
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: host });
    onSelectionChangeRef.current(null);

    return () => {
      view.destroy();
    };
  }, [text]);

  return <div className="h-full min-h-0" ref={hostRef} />;
}

function selectionFromState(state: EditorState): TextSelection | null {
  const range = state.selection.main;
  if (range.empty) {
    return null;
  }

  const from = Math.min(range.from, range.to);
  const to = Math.max(range.from, range.to);
  return {
    text: state.sliceDoc(from, to),
    startLine: state.doc.lineAt(from).number,
  };
}
