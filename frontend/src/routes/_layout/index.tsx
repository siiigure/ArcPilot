import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { PostCard } from "@/components/feed/PostCard"
import { QuickPostBox } from "@/components/feed/QuickPostBox"
import { useLocale } from "@/contexts/locale-context"
import { PostsService } from "@/client"
import { getHiddenPostIds } from "@/lib/hidden-posts"
import { mapPostPublicToFeedPost } from "@/lib/feed-map"
import type { Post } from "@/types"

export const Route = createFileRoute("/_layout/")({
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
  const [feedTick, setFeedTick] = useState(0)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feedPosts"],
    queryFn: () => PostsService.listPosts({ skip: 0, limit: 20 }),
  })

  const posts: Post[] = useMemo(() => {
    const hidden = getHiddenPostIds()
    return (
      data
        ?.map((p) => mapPostPublicToFeedPost(p, locale))
        .filter((p) => !hidden.has(p.id)) ?? []
    )
  }, [data, locale, feedTick])

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <QuickPostBox />
      {isLoading ? (
        <div className="py-8 text-sm text-muted-foreground">{t("feed.loading")}</div>
      ) : isError ? (
        <div className="py-8 text-sm text-red-600">{t("feed.error")}</div>
      ) : posts.length === 0 ? (
        <div className="py-8 text-sm text-muted-foreground">{t("feed.empty")}</div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostHidden={() => setFeedTick((n) => n + 1)}
          />
        ))
      )}
    </div>
  )
}

