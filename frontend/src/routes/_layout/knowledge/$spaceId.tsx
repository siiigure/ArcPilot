/**
 * 知识库：按协作空间划分的三栏布局（导航 / 正文区 / 预留大纲）。
 * 子路由由 <Outlet /> 渲染：index 为欢迎页，$docSlug 为单篇阅读。
 */
import { useQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router"
import { ChevronLeft, FileText, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useLocale } from "@/contexts/locale-context"
import { getKnowledgeTree, searchKnowledge } from "@/lib/knowledge-api"
import { getSpace } from "@/lib/spaces-api"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_layout/knowledge/$spaceId")({
  component: KnowledgeSpaceLayout,
  head: ({ params }) => ({
    meta: [{ title: `Knowledge — ${params.spaceId}` }],
  }),
})

function KnowledgeSpaceLayout() {
  const { spaceId } = Route.useParams()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const { t } = useLocale()

  const spaceQuery = useQuery({
    queryKey: ["collabSpace", spaceId],
    queryFn: () => getSpace(spaceId),
  })

  const treeQuery = useQuery({
    queryKey: ["knowledgeTree", spaceId],
    queryFn: () => getKnowledgeTree(spaceId),
    enabled: spaceQuery.isSuccess,
  })

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")

  const searchQuery = useQuery({
    queryKey: ["knowledgeSearch", spaceId, debouncedQ],
    queryFn: () => searchKnowledge(spaceId, debouncedQ),
    enabled: searchOpen && debouncedQ.trim().length >= 1,
  })

  useEffect(() => {
    const tmr = window.setTimeout(() => {
      setDebouncedQ(searchQ.trim())
    }, 320)
    return () => window.clearTimeout(tmr)
  }, [searchQ])

  /** Cmd/Ctrl+K：打开知识库内搜索（不劫持全局 Header 搜索） */
  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setSearchOpen(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onKey])

  const docs = treeQuery.data?.documents ?? []
  const categories = treeQuery.data?.categories ?? []

  /** 文档按 category_id 分组 */
  const byCategory = useMemo(() => {
    const m = new Map<number | null, typeof docs>()
    for (const d of docs) {
      const k = d.category_id
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(d)
    }
    return m
  }, [docs])

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id,
      ),
    [categories],
  )

  const renderDocLink = (d: (typeof docs)[0], indent: boolean) => {
    const active = pathname === `/knowledge/${spaceId}/${d.slug}`
    return (
      <Link
        key={d.id}
        to="/knowledge/$spaceId/$docSlug"
        params={{ spaceId, docSlug: d.slug }}
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2 transition-colors",
          indent ? "pl-4" : "pl-2",
          active ? "bg-accent text-accent-foreground" : "hover:bg-muted/80",
        )}
      >
        <FileText className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        <span className="truncate">{d.title}</span>
      </Link>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-4 lg:flex-row lg:gap-6">
      <aside className="w-full shrink-0 border-border lg:w-[260px] lg:border-r lg:pr-4">
        <Link
          to="/knowledge"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t("knowledge.backHub")}
        </Link>

        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight">
            {spaceQuery.data?.name ?? t("knowledge.loadingSpace")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("knowledge.spaceHint")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mb-4 w-full justify-start gap-2"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" aria-hidden />
          {t("knowledge.searchShortcut")}
        </Button>

        <nav className="space-y-1 text-sm" aria-label={t("knowledge.navAria")}>
          {(byCategory.get(null) ?? []).map((d) => renderDocLink(d, false))}

          {sortedCategories.map((c) => {
            const group = byCategory.get(c.id) ?? []
            if (group.length === 0) return null
            return (
              <div key={c.id} className="mt-3">
                <div className="mb-1 pl-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.title}
                </div>
                {group.map((d) => renderDocLink(d, true))}
              </div>
            )
          })}
        </nav>

        {treeQuery.isSuccess && docs.length === 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            {t("knowledge.emptyDocs")}
          </p>
        )}
      </aside>

      <div className="min-w-0 flex-1 lg:flex lg:gap-8">
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
        <aside className="hidden w-[180px] shrink-0 text-xs text-muted-foreground xl:block">
          <p className="sticky top-24">{t("knowledge.outlinePlaceholder")}</p>
        </aside>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("knowledge.searchTitle")}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder={t("knowledge.searchPlaceholder")}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {(searchQuery.data?.hits ?? []).map((h) => (
              <li key={h.slug}>
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    setSearchOpen(false)
                    void navigate({
                      to: "/knowledge/$spaceId/$docSlug",
                      params: { spaceId, docSlug: h.slug },
                    })
                  }}
                >
                  <span className="font-medium">{h.title}</span>
                  {h.excerpt ? (
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                      {h.excerpt}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {searchQuery.isFetched &&
            debouncedQ &&
            (searchQuery.data?.hits.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("knowledge.searchEmpty")}
              </p>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
