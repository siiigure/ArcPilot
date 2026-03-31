import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import { TagsService } from "@/client"
import { useLocale } from "@/contexts/locale-context"

export const Route = createFileRoute("/_layout/topics/")({
  component: TopicsPage,
  head: () => ({
    meta: [{ title: "Topics — Arcpilot" }],
  }),
})

function TopicsPage() {
  const { t } = useLocale()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tags"],
    queryFn: TagsService.listTags,
  })

  const tags = data?.data ?? []

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("post.backHome")}
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">{t("topics.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("topics.subtitle")}</p>

      {isLoading ? (
        <div className="py-8 text-sm text-muted-foreground">{t("feed.loading")}</div>
      ) : isError ? (
        <div className="py-8 text-sm text-red-600">{t("feed.error")}</div>
      ) : tags.length === 0 ? (
        <div className="py-8 text-sm text-muted-foreground">{t("topics.empty")}</div>
      ) : (
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-3 shadow-sm"
            >
              <div>
                <span className="font-medium">{tag.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{tag.slug}</span>
              </div>
              {tag.is_official ? (
                <span className="rounded-full bg-[#82ba00]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5a8000] dark:text-[#a3d94d]">
                  {t("topics.official")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
