import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { Header } from "@/components/layout/Header"
import { LeftSidebar } from "@/components/layout/LeftSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { CreateComposerDialog } from "@/components/composer/CreateComposerDialog"
import { AiChatProvider } from "@/contexts/ai-chat-context"
import { AppShellProvider, useAppShell } from "@/contexts/app-shell-context"
import { CreateComposerProvider } from "@/contexts/create-composer-context"
import { DEMO_TOPICS } from "@/data/mock-feed"
import { isLoggedIn } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  return (
    <AppShellProvider>
      <AiChatProvider>
        <CreateComposerProvider>
          <LayoutShell />
          <CreateComposerDialog />
        </CreateComposerProvider>
      </AiChatProvider>
    </AppShellProvider>
  )
}

function LayoutShell() {
  const { closeOverlays } = useAppShell()

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background supports-[height:100dvh]:h-dvh">
      <Header />
      {/* 固定三栏：左侧导航 / 中间主内容 / 右侧 AI（参考 Quora 三栏布局） */}
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 gap-4 px-4 pb-4 pt-0">
        <aside
          className={cn(
            "flex min-h-0 w-64 shrink-0 flex-col border-r border-border bg-background",
            "relative flex",
          )}
        >
          <LeftSidebar topics={DEMO_TOPICS} />
        </aside>
        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain pt-2 [scrollbar-gutter:stable]",
            // 中间栏稍微收窄一点（让三栏更像 Quora 的视觉比例）
            "mx-auto w-full max-w-[680px]",
          )}
        >
          {/* 点击遮罩关闭浮层：虽然固定三栏，但保留该方法避免遗留状态影响 */}
          <div onClick={closeOverlays}>
            <Outlet />
          </div>
        </main>
        <aside
          className={cn(
            "flex min-h-0 w-80 shrink-0 flex-col border-l border-border bg-background",
            "relative flex",
          )}
        >
          <RightSidebar />
        </aside>
      </div>
    </div>
  )
}

export default Layout
