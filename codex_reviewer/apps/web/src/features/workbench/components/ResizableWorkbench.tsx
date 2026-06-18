import { ChevronLeft, ChevronRight, GitBranch, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Group as PanelGroup,
  Panel as ResizePanel,
  Separator as ResizeHandlePrimitive,
} from "react-resizable-panels";
import { cn } from "@/shared/lib/cn";

const WORKBENCH_COLLAPSED_STORAGE_KEY = "codex-reviewer.workbench.collapsed.v1";

type ResizableWorkbenchProps = {
  versionRail: ReactNode;
  commitQueue: ReactNode;
  fileQueue: ReactNode;
  diffReview: ReactNode;
  reviewPanel: ReactNode;
};

export function ResizableWorkbench({
  versionRail,
  commitQueue,
  fileQueue,
  diffReview,
  reviewPanel,
}: ResizableWorkbenchProps) {
  const [collapsed, setCollapsed] = useState(() => loadCollapsedState(WORKBENCH_COLLAPSED_STORAGE_KEY));
  const persistCollapsed = (state: CollapsedState) => {
    setCollapsed(state);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKBENCH_COLLAPSED_STORAGE_KEY, JSON.stringify(state));
    }
  };

  return (
    <>
      <div className="grid gap-3 overflow-y-auto p-3 lg:hidden">
        <MobilePane className="h-56">{versionRail}</MobilePane>
        <MobilePane className="h-80">{commitQueue}</MobilePane>
        <MobilePane className="h-72">{fileQueue}</MobilePane>
        <MobilePane className="h-96">{diffReview}</MobilePane>
        <MobilePane className="h-[42rem]">{reviewPanel}</MobilePane>
      </div>
      <PanelGroup className="hidden h-full min-h-0 lg:flex" orientation="horizontal">
        <ResizePanel
          className="min-h-0"
          collapsible
          collapsedSize="4%"
          defaultSize="17%"
          maxSize="28%"
          minSize="13%"
        >
          {collapsed.left ? (
            <CollapsedRail
              icon={<GitBranch className="size-4" aria-hidden="true" />}
              label="Versions"
              onExpand={() => persistCollapsed({ ...collapsed, left: false })}
              side="left"
            />
          ) : (
            <PaneFrame>
              {versionRail}
              <CollapseButton
                label="Collapse versions"
                onCollapse={() => persistCollapsed({ ...collapsed, left: true })}
                side="left"
              />
            </PaneFrame>
          )}
        </ResizePanel>
        <ResizeHandle />
        <ResizePanel className="min-h-0" defaultSize="61%" minSize="40%">
          <PanelGroup className="min-h-0" orientation="horizontal">
            <ResizePanel className="min-h-0" defaultSize="28%" maxSize="36%" minSize="18%">
              <PaneFrame>{commitQueue}</PaneFrame>
            </ResizePanel>
            <ResizeHandle />
            <ResizePanel className="min-h-0" defaultSize="30%" maxSize="40%" minSize="18%">
              <PaneFrame>{fileQueue}</PaneFrame>
            </ResizePanel>
            <ResizeHandle />
            <ResizePanel className="min-h-0" defaultSize="42%" minSize="30%">
              <PaneFrame>{diffReview}</PaneFrame>
            </ResizePanel>
          </PanelGroup>
        </ResizePanel>
        <ResizeHandle />
        <ResizePanel
          className="min-h-0"
          collapsible
          collapsedSize="4%"
          defaultSize="22%"
          maxSize="36%"
          minSize="18%"
        >
          {collapsed.right ? (
            <CollapsedRail
              icon={<ListChecks className="size-4" aria-hidden="true" />}
              label="Review"
              onExpand={() => persistCollapsed({ ...collapsed, right: false })}
              side="right"
            />
          ) : (
            <PaneFrame>
              {reviewPanel}
              <CollapseButton
                label="Collapse review panel"
                onCollapse={() => persistCollapsed({ ...collapsed, right: true })}
                side="right"
              />
            </PaneFrame>
          )}
        </ResizePanel>
      </PanelGroup>
    </>
  );
}

type CollapsedState = {
  left: boolean;
  right: boolean;
};

function loadCollapsedState(storageKey: string): CollapsedState {
  if (typeof window === "undefined") {
    return { left: false, right: false };
  }
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) {
    return { left: false, right: false };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CollapsedState>;
    return {
      left: parsed.left === true,
      right: parsed.right === true,
    };
  } catch {
    return { left: false, right: false };
  }
}

function PaneFrame({ children }: { children: ReactNode }) {
  return <div className="relative h-full min-h-0 overflow-hidden">{children}</div>;
}

function MobilePane({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className={cn("min-w-0 overflow-hidden border border-slate-200 bg-white", className)}>
      {children}
    </div>
  );
}

function ResizeHandle() {
  return (
    <ResizeHandlePrimitive className="group relative z-10 w-2 shrink-0 bg-slate-100 transition hover:bg-slate-200 data-[resize-handle-state=drag]:bg-slate-300">
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 transition group-hover:bg-slate-500" />
    </ResizeHandlePrimitive>
  );
}

function CollapsedRail({
  icon,
  label,
  onExpand,
  side,
}: {
  icon: ReactNode;
  label: string;
  onExpand: () => void;
  side: "left" | "right";
}) {
  const Icon = side === "left" ? ChevronRight : ChevronLeft;
  return (
    <aside className="flex h-full min-h-0 flex-col items-center border-x border-slate-200 bg-white py-3">
      <button
        aria-label={`Expand ${label}`}
        className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-100"
        onClick={onExpand}
        title={`Expand ${label}`}
        type="button"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
      <div className="mt-4 flex flex-1 flex-col items-center gap-3 text-slate-500">
        {icon}
        <span className="[writing-mode:vertical-rl] text-xs font-semibold uppercase">{label}</span>
      </div>
    </aside>
  );
}

function CollapseButton({
  label,
  onCollapse,
  side,
}: {
  label: string;
  onCollapse: () => void;
  side: "left" | "right";
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={label}
      className={cn(
        "absolute top-3 z-20 inline-flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-950",
        side === "left" ? "right-2" : "left-2",
      )}
      onClick={onCollapse}
      title={label}
      type="button"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
