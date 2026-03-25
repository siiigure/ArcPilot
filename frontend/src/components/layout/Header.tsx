import { Link } from "@tanstack/react-router"
import { Bell, Globe, LogOut, Menu, Search, Settings } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { useAppShell } from "@/contexts/app-shell-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"
import { useSearch } from "@/hooks/use-search"

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
  const { query, setQuery, handleSearch } = useSearch()
  const { user, logout } = useAuth()
  const { navOpen, toggleNav } = useAppShell()

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-2 px-4 sm:gap-4">
        <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleNav}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground xl:hidden"
            aria-expanded={navOpen}
            aria-label={navOpen ? "关闭导航菜单" : "打开导航菜单"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/"
            className="cursor-pointer text-xl font-bold tracking-tight text-[#82ba00] sm:text-2xl"
          >
            Arcpilot
          </Link>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative min-w-0 max-w-2xl flex-1"
        >
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-muted/60 py-1.5 pr-4 pl-10 text-sm text-foreground transition-colors focus:ring-2 focus:ring-[#82ba00]/40 focus:outline-none dark:bg-muted/40"
            placeholder="Search Arcpilot"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
          <Appearance />
          <button
            type="button"
            className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
            aria-label="Language"
          >
            <Globe className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex shrink-0 rounded-full bg-[#82ba00] px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#72a400] sm:px-4 sm:text-sm"
          >
            Add question
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium text-foreground"
                aria-label="Account menu"
              >
                {user
                  ? userInitials(user.email, user.full_name)
                  : "…"}
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
                  账户设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
