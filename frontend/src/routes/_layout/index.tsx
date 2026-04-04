import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { ApiError, PostsService } from "@/client"
import { PostCard } from "@/components/feed/PostCard"
import { QuickPostBox } from "@/components/feed/QuickPostBox"
import { useFluidLayout } from "@/contexts/fluid-layout-context"
import { useLocale } from "@/contexts/locale-context"
import { mapPostPublicToFeedPost } from "@/lib/feed-map"
import { getHiddenPostIds } from "@/lib/hidden-posts"
import { isUuidString } from "@/lib/uuid"
import type { Post } from "@/types"

const feedSearchSchema = z.object({
  tagId: z.string().optional(),
  tagName: z.string().optional(),
})

export const Route = createFileRoute("/_layout/")({
  validateSearch: feedSearchSchema,
  component: FeedHome,
  head: () => ({
    meta: [
      {
        title: "Arcpilot",
      },
    ],
  }),
})

function FeedHome() {
  const { locale, t } = useLocale()
  const forumCompact = useFluidLayout()?.forumViewCompact ?? false
  const { tagId: tagIdRaw, tagName } = Route.useSearch()
  const tagId = isUuidString(tagIdRaw) ? tagIdRaw : undefined
  const [, setFeedTick] = useState(0)

  const mainQuery = useQuery({
    queryKey: ["feedPosts", tagId ?? "all"],
    queryFn: () =>
      tagId
        ? PostsService.listPosts({ skip: 0, limit: 20, tagId })
        : PostsService.listPosts({ skip: 0, limit: 20 }),
  })

  const needFallback =
    Boolean(tagId) &&
    !mainQuery.isLoading &&
    !mainQuery.isError &&
    (mainQuery.data?.length ?? 0) === 0

  const fallbackQuery = useQuery({
    queryKey: ["feedPosts", "fallback"],
    queryFn: () => PostsService.listPosts({ skip: 0, limit: 20 }),
    enabled: needFallback,
  })

  const showFallbackBanner = needFallback && fallbackQuery.isSuccess
  const rawList =
    showFallbackBanner && fallbackQuery.data
      ? fallbackQuery.data
      : (mainQuery.data ?? [])

  const hidden = getHiddenPostIds()
  const posts: Post[] =
    rawList
      .map((p) => mapPostPublicToFeedPost(p, locale))
      .filter((p) => !hidden.has(p.id)) ?? []

  const loading =
    mainQuery.isLoading || (needFallback && fallbackQuery.isLoading)
  const isError = mainQuery.isError
  const is404 =
    mainQuery.isError &&
    mainQuery.error instanceof ApiError &&
    mainQuery.error.status === 404

  return (
    <div className="mx-auto max-w-2xl pb-8">
      {!forumCompact ? <QuickPostBox /> : null}
      {tagId ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t("feed.topicFilterLabel")}{" "}
            <span className="font-medium text-foreground">
              {tagName?.trim() || t("feed.topicUnnamed")}
            </span>
          </span>
          <Link
            to="/"
            search={{}}
            className="text-[#82ba00] underline-offset-2 hover:underline"
          >
            {t("feed.clearTopicFilter")}
          </Link>
        </div>
      ) : null}
      {loading ? (
        <div className="py-8 text-sm text-muted-foreground">
          {t("feed.loading")}
        </div>
      ) : is404 ? (
        <div className="space-y-3 py-8">
          <p className="text-sm text-red-600">{t("feed.topicNotFound")}</p>
          <Link
            to="/"
            search={{}}
            className="text-sm text-[#82ba00] underline-offset-2 hover:underline"
          >
            {t("feed.clearTopicFilter")}
          </Link>
        </div>
      ) : isError ? (
        <div className="py-8 text-sm text-red-600">{t("feed.error")}</div>
      ) : showFallbackBanner ? (
        <>
          <div className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t("feed.topicEmptyFallback")}
          </div>
          {posts.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              {t("feed.empty")}
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                compact={forumCompact}
                onPostHidden={() => setFeedTick((n) => n + 1)}
              />
            ))
          )}
        </>
      ) : posts.length === 0 ? (
        <div className="py-8 text-sm text-muted-foreground">
          {t("feed.empty")}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            compact={forumCompact}
            onPostHidden={() => setFeedTick((n) => n + 1)}
          />
        ))
      )}
    </div>
  )
}
