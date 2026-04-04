import { createFileRoute, redirect } from "@tanstack/react-router"
import { CreateComposerDialog } from "@/components/composer/CreateComposerDialog"
import { FluidWorkspace } from "@/components/layout/FluidWorkspace"
import { Header } from "@/components/layout/Header"
import { AiChatProvider } from "@/contexts/ai-chat-context"
import { AppShellProvider, useAppShell } from "@/contexts/app-shell-context"
import { CreateComposerProvider } from "@/contexts/create-composer-context"
import { FluidLayoutProvider } from "@/contexts/fluid-layout-context"
import { isLoggedIn } from "@/hooks/useAuth"

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
    <div className="app-surface flex h-svh min-h-0 flex-col overflow-hidden bg-background supports-[height:100dvh]:h-dvh">
      <div className="app-surface-inner flex min-h-0 flex-1 flex-col">
        <FluidLayoutProvider>
          <Header />
          <FluidWorkspace closeOverlays={closeOverlays} />
        </FluidLayoutProvider>
      </div>
    </div>
  )
}

export default Layout
