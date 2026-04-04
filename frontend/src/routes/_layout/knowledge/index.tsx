/**
 * 知识库入口：列出用户可访问的协作空间，进入对应 `/knowledge/:spaceId`。
 * 数据来自既有 listSpaces API，不写新知识库表。
 */
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft, FolderKanban } from "lucide-react"

import { useLocale } from "@/contexts/locale-context"
import { listSpaces } from "@/lib/spaces-api"

export const Route = createFileRoute("/_layout/knowledge/")({
  component: KnowledgeHubPage,
  head: () => ({
    meta: [{ title: "Knowledge base — Arcpilot" }],
  }),
})

function KnowledgeHubPage() {
  const { t } = useLocale()

  const spacesQuery = useQuery({
    queryKey: ["collabSpaces"],
    queryFn: listSpaces,
  })

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("post.backHome")}
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {t("knowledge.hubTitle")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("knowledge.hubSubtitle")}
      </p>

      {spacesQuery.isLoading && (
        <p className="text-sm text-muted-foreground">
          {t("knowledge.hubLoading")}
        </p>
      )}

      {spacesQuery.isError && (
        <p className="text-sm text-destructive">{t("knowledge.hubError")}</p>
      )}

      {spacesQuery.isSuccess && spacesQuery.data.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("knowledge.hubEmpty")}
        </div>
      )}

      {spacesQuery.isSuccess && spacesQuery.data.data.length > 0 && (
        <ul className="space-y-2">
          {spacesQuery.data.data.map((s) => (
            <li key={s.id}>
              <Link
                to="/knowledge/$spaceId"
                params={{ spaceId: s.id }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-[#82ba00]/40 hover:bg-muted/30"
              >
                <FolderKanban
                  className="h-5 w-5 shrink-0 text-[#82ba00]"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.name}</div>
                  {s.description ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {s.description}
                    </div>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("knowledge.hubOpen")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
