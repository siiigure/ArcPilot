import { Link, useRouterState, useSearch } from "@tanstack/react-router"
import {
  AlignLeft,
  AlignRight,
  Bot,
  Columns2,
  Globe,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppShell } from "@/contexts/app-shell-context"
import { useCreateComposer } from "@/contexts/create-composer-context"
import { useFluidLayout } from "@/contexts/fluid-layout-context"
import { useLocale } from "@/contexts/locale-context"
import { useSearch as useHeaderSearch } from "@/hooks/use-search"
import useAuth from "@/hooks/useAuth"
import { LOCALE_OPTIONS } from "@/i18n/messages"
import { cn } from "@/lib/utils"

function userInitials(email: string, fullName: string | null | undefined) {
  const trimmed = fullName?.trim()
  if (trimmed) {
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    }
    return trimmed.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function useWorkspaceStatusLabel() {
  const { t } = useLocale()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const loose = useSearch({ strict: false })
  const tagName =
    typeof loose.tagName === "string" ? loose.tagName.trim() : undefined

  let forumFocus = t("header.ctxHome")
  if (pathname === "/") {
    forumFocus = tagName || t("header.ctxHome")
  } else if (pathname.startsWith("/topics")) {
    forumFocus = t("topics.title")
  } else if (pathname.startsWith("/knowledge")) {
    forumFocus = t("sidebar.knowledgeBase")
  } else if (pathname.startsWith("/spaces")) {
    forumFocus = t("sidebar.collabSpaces")
  } else if (pathname.startsWith("/post/")) {
    forumFocus = t("header.ctxPostView")
  } else if (pathname.startsWith("/u/")) {
    forumFocus = t("profile.tabPosts")
  } else if (pathname.startsWith("/settings")) {
    forumFocus = t("header.accountSettings")
  }

  return `${t("header.ctxForum")}: ${forumFocus} ${t("header.ctxSep")} ${t("header.ctxAi")}`
}

export const Header = () => {
  const { query, setQuery, handleSearch } = useHeaderSearch()
  const { user, logout } = useAuth()
  const { navOpen, toggleNav, aiOpen, toggleAi } = useAppShell()
  const { openComposer } = useCreateComposer()
  const { locale, setLocale, t } = useLocale()
  const fluid = useFluidLayout()
  const statusLine = useWorkspaceStatusLabel()

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/90 shadow-sm backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 w-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleNav}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
            aria-expanded={navOpen}
            aria-label={navOpen ? t("header.navClose") : t("header.navOpen")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/"
            className="cursor-pointer text-lg font-bold tracking-tight text-[#82ba00] sm:text-xl"
          >
            Arcpilot
          </Link>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative min-w-0 max-w-md flex-1 md:max-w-lg lg:max-w-xl"
        >
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-muted/60 py-1.5 pr-4 pl-10 text-sm text-foreground transition-colors focus:ring-2 focus:ring-[#82ba00]/40 focus:outline-none dark:bg-muted/40"
            placeholder={t("header.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="hidden min-w-0 flex-1 px-2 lg:block lg:max-w-md lg:flex-none">
          <p
            className="truncate text-center text-xs text-muted-foreground sm:text-sm"
            title={statusLine}
          >
            {statusLine}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-0.5 border-r border-border pr-2 lg:flex">
          <button
            type="button"
            title={t("header.layoutForum")}
            onClick={() => fluid?.applyPreset("forum")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-none border transition-colors",
              fluid?.preset === "forum"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t("header.layoutBalanced")}
            onClick={() => fluid?.applyPreset("balanced")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-none border transition-colors",
              fluid?.preset === "balanced"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <Columns2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t("header.layoutAi")}
            onClick={() => fluid?.applyPreset("ai")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-none border transition-colors",
              fluid?.preset === "ai"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={toggleAi}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
            aria-expanded={aiOpen}
            aria-label={aiOpen ? t("header.closeAi") : t("header.openAi")}
          >
            <Bot className="h-5 w-5" />
          </button>
          <Appearance />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
                aria-label={t("header.language")}
              >
                <Globe className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{t("header.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(v) => {
                  if (v === "zh" || v === "en") setLocale(v)
                }}
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => openComposer("ask")}
            className="inline-flex shrink-0 rounded-full bg-[#82ba00] px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#72a400] sm:px-4 sm:text-sm"
          >
            {t("header.ask")}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium text-foreground"
                aria-label="Account menu"
              >
                {user ? userInitials(user.email, user.full_name) : "…"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      {user.full_name ? (
                        <span className="text-sm font-medium">
                          {user.full_name}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground text-xs">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("header.accountSettings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("header.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
