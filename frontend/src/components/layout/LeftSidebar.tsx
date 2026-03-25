import { Link, useRouterState } from "@tanstack/react-router"
import {
  Bell,
  BookOpen,
  Film,
  Heart,
  Home,
  Laptop,
  Music,
  Plus,
  Rss,
  SquarePen,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { useAppShell } from "@/contexts/app-shell-context"
import type { Topic } from "@/types"

interface LeftSidebarProps {
  topics: Topic[]
}

const IconMap: Record<string, ComponentType<{ className?: string }>> = {
  Utensils,
  BookOpen,
  Music,
  UtensilsCrossed,
  Laptop,
  Film,
  Heart,
}

export const LeftSidebar = ({ topics }: LeftSidebarProps) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { closeNav } = useAppShell()

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="modern-card flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5 xl:hidden">
          <span className="text-sm font-semibold">导航</span>
          <button
            type="button"
            onClick={closeNav}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="关闭导航"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          <nav className="mb-8 space-y-1">
            <NavItem
              to="/"
              icon={<Home className="h-5 w-5" />}
              label="Home"
              active={pathname === "/"}
              onNavigate={closeNav}
            />
            <NavItemButton
              icon={<Rss className="h-5 w-5" />}
              label="Following"
            />
            <NavItemButton
              icon={<SquarePen className="h-5 w-5" />}
              label="Answer"
            />
            <NavItemButton
              icon={<Bell className="h-5 w-5" />}
              label="Notifications"
            />
          </nav>

          <div className="mb-3 px-3">
            <h4 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase dark:text-gray-500">
              Spaces
            </h4>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-sm text-gray-600 transition-all hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <div className="rounded-lg bg-gray-200/50 p-1.5 transition-transform group-hover:scale-110 dark:bg-white/10">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-medium">Create Space</span>
            </button>

            {topics.map((topic) => {
              const Icon = topic.icon ? IconMap[topic.icon] : null
              return (
                <Link
                  key={topic.id}
                  to="/"
                  onClick={closeNav}
                  className="group flex items-center gap-3 rounded-xl p-2.5 text-sm text-gray-600 transition-all hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <div
                    className={`rounded-lg bg-gray-50 p-1.5 dark:bg-white/5 ${topic.color || "text-gray-500"} transition-transform group-hover:scale-110`}
                  >
                    {Icon ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                  <span className="font-medium transition-colors group-hover:text-[#82ba00]">
                    {topic.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

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
      </div>
    </div>
  )
}

function NavItem({
  to,
  icon,
  label,
  active,
  onNavigate,
}: {
  to: string
  icon: ReactNode
  label: string
  active: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`group flex w-full items-center gap-3 rounded-xl p-3 text-sm font-semibold transition-all ${
        active
          ? "bg-[#82ba00]/10 text-[#82ba00] shadow-sm"
          : "text-gray-600 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-white/5"
      }`}
    >
      <div
        className={`transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  )
}

function NavItemButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 rounded-xl p-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-white/5"
    >
      <div className="transition-transform group-hover:scale-110">{icon}</div>
      <span>{label}</span>
    </button>
  )
}
