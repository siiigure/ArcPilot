import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Bot } from "lucide-react"

import { Header } from "@/components/layout/Header"
import { LeftSidebar } from "@/components/layout/LeftSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { AppShellProvider, useAppShell } from "@/contexts/app-shell-context"
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
      <LayoutShell />
    </AppShellProvider>
  )
}

function LayoutShell() {
  const { navOpen, aiOpen, closeOverlays, toggleAi } = useAppShell()

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background supports-[height:100dvh]:h-dvh">
      <Header />
      {/* 窄屏：仅中间栏；导航与 AI 以浮层打开。≥xl：三栏同屏 */}
      {(navOpen || aiOpen) && (
        <div
          role="presentation"
          className="fixed inset-x-0 top-14 bottom-0 z-40 bg-black/50 xl:hidden"
          onClick={closeOverlays}
          aria-hidden
        />
      )}
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 gap-4 px-4 pb-4 pt-0">
        <aside
          className={cn(
            "flex min-h-0 w-64 shrink-0 flex-col border-r border-border bg-background",
            navOpen
              ? "max-xl:fixed max-xl:top-14 max-xl:left-0 max-xl:bottom-0 max-xl:z-50 max-xl:flex max-xl:shadow-2xl"
              : "max-xl:hidden",
            "xl:relative xl:flex",
          )}
        >
          <LeftSidebar topics={DEMO_TOPICS} />
        </aside>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain pt-2 [scrollbar-gutter:stable]">
          <Outlet />
        </main>
        <aside
          className={cn(
            "flex min-h-0 w-80 shrink-0 flex-col border-l border-border bg-background",
            aiOpen
              ? "max-xl:fixed max-xl:top-14 max-xl:right-0 max-xl:bottom-0 max-xl:z-50 max-xl:flex max-xl:shadow-2xl"
              : "max-xl:hidden",
            "xl:relative xl:flex",
          )}
        >
          <RightSidebar />
        </aside>
      </div>
      {/* 小屏：右下角唤起 AI（与 Header 按钮二选一亦可；此处保证拇指易达） */}
      <button
        type="button"
        onClick={toggleAi}
        className={cn(
          "fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#82ba00] text-white shadow-lg transition hover:bg-[#72a400] xl:hidden",
          aiOpen && "ring-2 ring-white/40 ring-offset-2 ring-offset-background",
        )}
        aria-label={aiOpen ? "关闭 AI 助手" : "打开 AI 助手"}
      >
        <Bot className="h-7 w-7" />
      </button>
    </div>
  )
}

export default Layout
