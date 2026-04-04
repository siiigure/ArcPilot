import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { z } from "zod"

import { PostsService } from "@/client"
import { PostCard } from "@/components/feed/PostCard"
import { useCreateComposer } from "@/contexts/create-composer-context"
import { useFluidLayout } from "@/contexts/fluid-layout-context"
import { useLocale } from "@/contexts/locale-context"
import { mapPostPublicToFeedPost } from "@/lib/feed-map"

const searchSchema = z.object({
  q: z.string().optional().catch(""),
})

export const Route = createFileRoute("/_layout/search")({
  validateSearch: searchSchema,
  component: SearchPage,
  head: () => ({
    meta: [{ title: "Search — Arcpilot" }],
  }),
})

function SearchPage() {
  const { locale, t } = useLocale()
  const { openComposer } = useCreateComposer()
  const { q: qRaw } = Route.useSearch()
  const q = (qRaw ?? "").trim()
  const forumCompact = useFluidLayout()?.forumViewCompact ?? false

  const searchQuery = useQuery({
    queryKey: ["postSearch", q],
    queryFn: () => PostsService.searchPosts({ q, skip: 0, limit: 20 }),
    enabled: q.length > 0,
  })

  const posts =
    searchQuery.data?.map((p) => mapPostPublicToFeedPost(p, locale)) ?? []

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("search.backHome")}
      </Link>

      <h1 className="mb-1 text-lg font-semibold text-foreground">
        {t("search.title")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("search.hintTitleOnly")}
      </p>

      {q.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("search.emptyNoQuery")}
        </div>
      ) : searchQuery.isLoading ? (
        <div className="py-8 text-sm text-muted-foreground">
          {t("search.loading")}
        </div>
      ) : searchQuery.isError ? (
        <div className="py-8 text-sm text-red-600">{t("search.error")}</div>
      ) : posts.length === 0 ? (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            {t("search.emptyNoResults")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link
              to="/topics"
              className="text-[#82ba00] underline-offset-2 hover:underline"
            >
              {t("search.suggestTopics")}
            </Link>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              className="text-[#82ba00] underline-offset-2 hover:underline"
              onClick={() => openComposer("post")}
            >
              {t("search.suggestPost")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} compact={forumCompact} />
          ))}
        </div>
      )}
    </div>
  )
}
