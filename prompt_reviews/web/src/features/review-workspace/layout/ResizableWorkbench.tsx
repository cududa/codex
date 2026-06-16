import { ChevronLeft, ChevronRight, GitBranch, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Group as PanelGroup,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
} from "react-resizable-panels";
import { cn } from "@/shared/lib/cn";
import {
  browserLayoutStorage,
  loadWorkbenchCollapsedState,
  saveWorkbenchCollapsedState,
  workbenchLayoutStorageKeys,
  type WorkbenchCollapsedState,
} from "./workbenchLayout";

type ResizableWorkbenchProps = {
  versionRail: ReactNode;
  commitQueue: ReactNode;
  fileQueue: ReactNode;
  diffReview: ReactNode;
  reviewActions: ReactNode;
};

export function ResizableWorkbench({
  versionRail,
  commitQueue,
  fileQueue,
  diffReview,
  reviewActions,
}: ResizableWorkbenchProps) {
  const storage = useMemo(browserLayoutStorage, []);
  const [collapsed, setCollapsed] = useState<WorkbenchCollapsedState>(() => loadWorkbenchCollapsedState(storage));
  const versionPanelRef = usePanelRef();
  const actionsPanelRef = usePanelRef();
  const outerLayout = useDefaultLayout({
    id: workbenchLayoutStorageKeys.outer,
    panelIds: ["version", "center", "reviewActions"],
    storage,
  });
  const centerLayout = useDefaultLayout({
    id: workbenchLayoutStorageKeys.center,
    panelIds: ["commitQueue", "fileQueue", "diffReview"],
    storage,
  });
  const previousCollapsed = useRef<WorkbenchCollapsedState>({ left: false, right: false });

  useEffect(() => {
    saveWorkbenchCollapsedState(storage, collapsed);
  }, [collapsed, storage]);

  useEffect(() => {
    if (previousCollapsed.current.left !== collapsed.left) {
      if (collapsed.left) {
        versionPanelRef.current?.collapse();
      } else {
        versionPanelRef.current?.expand();
      }
    }
    if (previousCollapsed.current.right !== collapsed.right) {
      if (collapsed.right) {
        actionsPanelRef.current?.collapse();
      } else {
        actionsPanelRef.current?.expand();
      }
    }
    previousCollapsed.current = collapsed;
  }, [actionsPanelRef, collapsed, versionPanelRef]);

  return (
    <PanelGroup
      className="min-h-0"
      defaultLayout={outerLayout.defaultLayout}
      id="prompt-reviews-workbench-outer"
      onLayoutChanged={outerLayout.onLayoutChanged}
      orientation="horizontal"
    >
      <Panel
        className="min-h-0"
        collapsedSize="4%"
        collapsible
        defaultSize="17%"
        id="version"
        maxSize="28%"
        minSize="13%"
        onResize={(size) => setCollapsed((state) => ({ ...state, left: size.asPercentage < 6 }))}
        panelRef={versionPanelRef}
      >
        {collapsed.left ? (
          <CollapsedRail
            icon={<GitBranch className="size-4" aria-hidden="true" />}
            label="Versions"
            onExpand={() => setCollapsed((state) => ({ ...state, left: false }))}
            side="left"
          />
        ) : (
          <PaneFrame>
            {versionRail}
            <CollapseEdgeButton
              label="Collapse versions"
              onCollapse={() => setCollapsed((state) => ({ ...state, left: true }))}
              side="left"
            />
          </PaneFrame>
        )}
      </Panel>

      <ResizeHandle />

      <Panel className="min-h-0" defaultSize="61%" id="center" minSize="40%">
        <PanelGroup
          className="min-h-0"
          defaultLayout={centerLayout.defaultLayout}
          id="prompt-reviews-workbench-center"
          onLayoutChanged={centerLayout.onLayoutChanged}
          orientation="horizontal"
        >
          <Panel className="min-h-0" defaultSize="28%" id="commitQueue" maxSize="36%" minSize="18%">
            <PaneFrame>{commitQueue}</PaneFrame>
          </Panel>

          <ResizeHandle />

          <Panel className="min-h-0" defaultSize="30%" id="fileQueue" maxSize="40%" minSize="18%">
            <PaneFrame>{fileQueue}</PaneFrame>
          </Panel>

          <ResizeHandle />

          <Panel className="min-h-0" defaultSize="42%" id="diffReview" minSize="30%">
            <PaneFrame>{diffReview}</PaneFrame>
          </Panel>
        </PanelGroup>
      </Panel>

      <ResizeHandle />

      <Panel
        className="min-h-0"
        collapsedSize="4%"
        collapsible
        defaultSize="22%"
        id="reviewActions"
        maxSize="36%"
        minSize="18%"
        onResize={(size) => setCollapsed((state) => ({ ...state, right: size.asPercentage < 6 }))}
        panelRef={actionsPanelRef}
      >
        {collapsed.right ? (
          <CollapsedRail
            icon={<ListChecks className="size-4" aria-hidden="true" />}
            label="Review actions"
            onExpand={() => setCollapsed((state) => ({ ...state, right: false }))}
            side="right"
          />
        ) : (
          <PaneFrame>
            {reviewActions}
            <CollapseEdgeButton
              label="Collapse review actions"
              onCollapse={() => setCollapsed((state) => ({ ...state, right: true }))}
              side="right"
            />
          </PaneFrame>
        )}
      </Panel>
    </PanelGroup>
  );
}

type CollapsedRailProps = {
  icon: ReactNode;
  label: string;
  onExpand: () => void;
  side: "left" | "right";
};

function CollapsedRail({ icon, label, onExpand, side }: CollapsedRailProps) {
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
        <span className="vertical-rl text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
    </aside>
  );
}

function PaneFrame({ children }: { children: ReactNode }) {
  return <div className="relative h-full min-h-0 overflow-hidden">{children}</div>;
}

type CollapseEdgeButtonProps = {
  label: string;
  onCollapse: () => void;
  side: "left" | "right";
};

function CollapseEdgeButton({ label, onCollapse, side }: CollapseEdgeButtonProps) {
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

function ResizeHandle({ className }: { className?: string }) {
  return (
    <Separator
      className={cn(
        "group relative z-10 w-2 shrink-0 bg-slate-100 transition hover:bg-slate-200 data-[resize-handle-state=drag]:bg-slate-300",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 transition group-hover:bg-slate-500" />
    </Separator>
  );
}
