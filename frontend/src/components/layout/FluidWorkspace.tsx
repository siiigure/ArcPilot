import { Outlet } from "@tanstack/react-router"
import { useCallback } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"

import { LeftSidebar } from "@/components/layout/LeftSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAppShell } from "@/contexts/app-shell-context"
import {
  FLUID_AI_MIN_PERCENT,
  FLUID_PANEL_AI,
  FLUID_PANEL_FORUM,
  useFluidLayout,
} from "@/contexts/fluid-layout-context"
import { useIsLargeScreen } from "@/hooks/use-is-large-screen"
import { cn } from "@/lib/utils"

type FluidWorkspaceProps = {
  closeOverlays: () => void
}

export function FluidWorkspace({ closeOverlays }: FluidWorkspaceProps) {
  const fluid = useFluidLayout()
  const isLg = useIsLargeScreen()
  const { navOpen, closeNav, aiOpen, closeAi } = useAppShell()

  const handleSeparatorDoubleClick = useCallback(() => {
    fluid?.toggleBalancedVsCustom()
  }, [fluid])

  if (!fluid) return null

  const {
    groupRef,
    navRailCompact,
    onLayoutChanged,
    onForumPanelResize,
    forumViewCompact,
    aiSplitLayout,
  } = fluid

  /** Panel 内必须 h-full + 独立 overflow-y-auto，否则帖子区随整页滚动、看不到列内滚动条 */
  const forumMain = (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]",
          forumViewCompact
            ? "bg-background/80 px-2 pt-1"
            : "bg-background/80 px-3 pt-2 md:px-4",
        )}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: 点击主内容区关闭抽屉浮层（与原壳一致） */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: 无键盘等效需求 */}
        <div
          onClick={closeOverlays}
          className="mx-auto min-h-0 w-full max-w-3xl pb-6"
        >
          <Outlet />
        </div>
      </div>
    </div>
  )

  if (isLg) {
    return (
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex min-h-0 shrink-0 flex-col border-r border-border bg-background/75 backdrop-blur-md transition-[width] duration-300 ease-out",
            navRailCompact ? "w-16" : "w-[200px]",
          )}
        >
          <LeftSidebar compactNav={navRailCompact} />
        </aside>

        <Group
          groupRef={groupRef}
          id="arc-fluid-main"
          orientation="horizontal"
          className="min-h-0 min-w-0 flex-1"
          defaultLayout={{ [FLUID_PANEL_FORUM]: 50, [FLUID_PANEL_AI]: 50 }}
          onLayoutChanged={onLayoutChanged}
        >
          <Panel
            id={FLUID_PANEL_FORUM}
            className="min-h-0 min-w-0"
            defaultSize="50%"
            minSize={15}
            onResize={onForumPanelResize}
          >
            {forumMain}
          </Panel>
          <Separator
            id="arc-fluid-sep"
            disableDoubleClick
            className={cn(
              "w-1 shrink-0 bg-border/80 transition-colors",
              "hover:bg-primary/35 focus-visible:bg-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            onDoubleClick={handleSeparatorDoubleClick}
          />
          <Panel
            id={FLUID_PANEL_AI}
            className="min-h-0 min-w-0"
            defaultSize="50%"
            minSize={FLUID_AI_MIN_PERCENT}
          >
            <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-border bg-background/75 backdrop-blur-md">
              <RightSidebar aiSplitLayout={aiSplitLayout} />
            </aside>
          </Panel>
        </Group>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {forumMain}

      <Sheet
        open={navOpen}
        onOpenChange={(open) => {
          if (!open) closeNav()
        }}
      >
        <SheetContent
          side="left"
          className="w-[min(100%,20rem)] rounded-r-2xl border-r border-border p-0 sm:max-w-xs"
        >
          <LeftSidebar compactNav={false} />
        </SheetContent>
      </Sheet>

      <Sheet
        open={aiOpen}
        onOpenChange={(open) => {
          if (!open) closeAi()
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(100%,24rem)] rounded-l-2xl border-l border-border p-0 sm:max-w-md"
        >
          <RightSidebar aiSplitLayout={false} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
