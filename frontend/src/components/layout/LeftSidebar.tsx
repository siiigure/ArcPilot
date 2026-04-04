import { useQuery } from "@tanstack/react-query"
import { Link, useRouterState, useSearch } from "@tanstack/react-router"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Film,
  FolderKanban,
  Heart,
  Home,
  Laptop,
  Library,
  Music,
  Rss,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { TagsService } from "@/client"
import {
  topicSlugToColorClass,
  topicSlugToIconKey,
} from "@/components/layout/topic-nav-styles"
import { useAppShell } from "@/contexts/app-shell-context"
import { useFluidLayout } from "@/contexts/fluid-layout-context"
import { useLocale } from "@/contexts/locale-context"
import { cn } from "@/lib/utils"

const IconMap: Record<string, ComponentType<{ className?: string }>> = {
  Utensils,
  BookOpen,
  Music,
  UtensilsCrossed,
  Laptop,
  Film,
  Heart,
}

type LeftSidebarProps = {
  /** AI 主导时收窄为图标栏 */
  compactNav?: boolean
}

export const LeftSidebar = ({ compactNav = false }: LeftSidebarProps) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const looseSearch = useSearch({ strict: false })
  const feedTagId =
    pathname === "/" && typeof looseSearch.tagId === "string"
      ? looseSearch.tagId
      : undefined
  const { closeNav } = useAppShell()
  const { t } = useLocale()
  const fluid = useFluidLayout()

  const { data: navRes } = useQuery({
    queryKey: ["tagsNav"],
    queryFn: () => TagsService.listTagsNav(),
  })
  const navTags = navRes?.data ?? []

  const homeActive = pathname === "/" && !feedTagId

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shell-panel flex h-full min-h-0 flex-col overflow-hidden">
        <div
          className={cn(
            "hidden shrink-0 items-center border-b border-border lg:flex",
            compactNav ? "justify-center py-1.5" : "justify-end px-2 py-1.5",
          )}
        >
          <button
            type="button"
            onClick={() => fluid?.toggleNavRail()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title={
              compactNav ? t("sidebar.expandRail") : t("sidebar.collapseRail")
            }
            aria-label={
              compactNav ? t("sidebar.expandRail") : t("sidebar.collapseRail")
            }
          >
            {compactNav ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5 lg:hidden">
          <span className="text-sm font-semibold">{t("sidebar.navTitle")}</span>
          <button
            type="button"
            onClick={closeNav}
            className="inline-flex h-9 w-9 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={t("sidebar.closeNav")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain touch-pan-y custom-scrollbar [scrollbar-gutter:stable]",
            compactNav ? "p-2" : "p-3 sm:p-4",
          )}
        >
          <nav className={cn("mb-4 space-y-1", !compactNav && "sm:mb-8")}>
            <NavItem
              to="/"
              search={{}}
              icon={<Home className="h-5 w-5" />}
              label={t("sidebar.home")}
              active={homeActive}
              onNavigate={closeNav}
              compact={compactNav}
            />
            <NavItem
              to="/knowledge"
              icon={<Library className="h-5 w-5" />}
              label={t("sidebar.knowledgeBase")}
              active={pathname.startsWith("/knowledge")}
              onNavigate={closeNav}
              compact={compactNav}
            />
            <NavItem
              to="/spaces"
              icon={<FolderKanban className="h-5 w-5" />}
              label={t("sidebar.collabSpaces")}
              active={pathname.startsWith("/spaces")}
              onNavigate={closeNav}
              compact={compactNav}
            />
          </nav>

          {!compactNav ? (
            <div className="mb-3 px-3">
              <h4 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase dark:text-gray-500">
                {t("sidebar.spaces")}
              </h4>
            </div>
          ) : null}

          <div className="space-y-1">
            <Link
              to="/topics"
              onClick={closeNav}
              title={t("sidebar.browseTopics")}
              className={cn(
                "group flex w-full items-center text-sm transition-all hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-none",
                compactNav ? "justify-center p-2.5" : "gap-3 p-2.5",
                pathname.startsWith("/topics")
                  ? "bg-[#82ba00]/10 text-[#82ba00]"
                  : "text-gray-600 dark:text-gray-300",
              )}
            >
              <div className="bg-[#82ba00]/15 p-1.5 text-[#82ba00] transition-transform group-hover:scale-110 dark:bg-[#82ba00]/20 rounded-none">
                <Rss className="h-4 w-4" />
              </div>
              {!compactNav ? (
                <span className="font-medium transition-colors group-hover:text-[#82ba00]">
                  {t("sidebar.browseTopics")}
                </span>
              ) : null}
            </Link>

            {navTags.map((tag) => {
              const iconKey = topicSlugToIconKey(tag.slug)
              const Icon = IconMap[iconKey] ?? BookOpen
              const colorClass = topicSlugToColorClass(tag.slug)
              const topicActive = pathname === "/" && feedTagId === tag.id
              return (
                <Link
                  key={tag.id}
                  to="/"
                  search={{ tagId: tag.id, tagName: tag.name }}
                  onClick={closeNav}
                  title={tag.name}
                  className={cn(
                    "group flex w-full items-center text-sm transition-all hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-none",
                    compactNav ? "justify-center p-2.5" : "gap-3 p-2.5",
                    topicActive
                      ? "bg-[#82ba00]/10 text-[#82ba00]"
                      : "text-gray-600 dark:text-gray-300",
                  )}
                >
                  <div
                    className={cn(
                      "bg-gray-50 p-1.5 dark:bg-white/5 rounded-none transition-transform group-hover:scale-110",
                      colorClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!compactNav ? (
                    <span className="font-medium transition-colors group-hover:text-[#82ba00]">
                      {tag.name}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>

        {!compactNav ? (
          <footer className="shrink-0 border-t border-gray-100/50 bg-gray-50/30 p-4 dark:border-white/5 dark:bg-white/5">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-gray-400">
              <span className="cursor-pointer transition-colors hover:text-[#82ba00]">
                About
              </span>
              <span className="cursor-pointer transition-colors hover:text-[#82ba00]">
                Privacy
              </span>
              <span className="cursor-pointer transition-colors hover:text-[#82ba00]">
                Terms
              </span>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  )
}

function NavItem({
  to,
  search,
  icon,
  label,
  active,
  onNavigate,
  compact,
}: {
  to: string
  search?: Record<string, string | undefined>
  icon: ReactNode
  label: string
  active: boolean
  onNavigate?: () => void
  compact?: boolean
}) {
  return (
    <Link
      to={to}
      {...(search !== undefined ? { search } : {})}
      onClick={onNavigate}
      title={label}
      className={cn(
        "group flex w-full items-center text-sm font-semibold transition-all rounded-none",
        compact ? "justify-center p-3" : "gap-3 p-3",
        active
          ? "bg-[#82ba00]/10 text-[#82ba00] shadow-sm"
          : "text-gray-600 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-white/5",
      )}
    >
      <div
        className={cn(
          "transition-transform",
          active ? "scale-110" : "group-hover:scale-110",
        )}
      >
        {icon}
      </div>
      {!compact ? <span>{label}</span> : null}
    </Link>
  )
}
