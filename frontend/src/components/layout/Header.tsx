import { Link } from "@tanstack/react-router"
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

export const Header = () => {
  const { query, setQuery, handleSearch } = useHeaderSearch()
  const { user, logout } = useAuth()
  const { navOpen, toggleNav, aiOpen, toggleAi } = useAppShell()
  const { locale, setLocale, t } = useLocale()
  const fluid = useFluidLayout()

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/90 shadow-sm backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/75">
      <div className="grid h-14 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
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

        <div className="w-[min(100vw-8rem,22rem)] min-w-0 justify-self-center sm:w-[min(100vw-10rem,26rem)] md:w-[min(100vw-12rem,32rem)]">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-input bg-muted/60 py-2 pr-4 pl-10 text-sm text-foreground shadow-sm transition-[box-shadow,background-color] focus:border-[#82ba00]/35 focus:bg-background focus:shadow-md focus:ring-2 focus:ring-[#82ba00]/25 focus:outline-none dark:bg-muted/40 dark:focus:bg-background/80"
              placeholder={t("header.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 justify-self-end md:gap-2">
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
