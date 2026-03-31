import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft, Users } from "lucide-react"
import { useMemo } from "react"

import type { UserPublicPreview } from "@/client"
import { UsersService } from "@/client"
import { PostCard } from "@/components/feed/PostCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocale } from "@/contexts/locale-context"
import useAuth from "@/hooks/useAuth"
import { dicebearAvatar, mapPostPublicToFeedPost } from "@/lib/feed-map"

export const Route = createFileRoute("/_layout/u/$userId")({
  component: UserProfilePage,
  head: ({ params }) => ({
    meta: [{ title: `用户 - ${params.userId}` }],
  }),
})

function displayName(u: UserPublicPreview) {
  return (
    u.display_name?.trim() ||
    u.full_name?.trim() ||
    u.username?.trim() ||
    "User"
  )
}

function UserProfilePage() {
  const { userId } = Route.useParams()
  const { locale, t } = useLocale()
  const { user: me } = useAuth()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => UsersService.getUserProfile({ userId }),
  })

  const postsQuery = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => UsersService.listUserPosts({ userId, skip: 0, limit: 50 }),
    enabled: profileQuery.isSuccess,
  })

  const answeredQuery = useQuery({
    queryKey: ["userAnsweredPosts", userId],
    queryFn: () =>
      UsersService.listUserAnsweredPosts({ userId, skip: 0, limit: 50 }),
    enabled: profileQuery.isSuccess,
  })

  const isSelf = me?.id === userId

  const followMutation = useMutation({
    mutationFn: async () => {
      const p = profileQuery.data
      if (!p || p.is_following === null) return
      if (p.is_following) {
        await UsersService.unfollowUser({ userId })
      } else {
        await UsersService.followUser({ userId })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["userProfile", userId] })
    },
  })

  const profile = profileQuery.data

  const posts = useMemo(
    () =>
      (postsQuery.data ?? []).map((p) => mapPostPublicToFeedPost(p, locale)),
    [postsQuery.data, locale],
  )

  const answered = useMemo(
    () =>
      (answeredQuery.data ?? []).map((p) =>
        mapPostPublicToFeedPost(p, locale),
      ),
    [answeredQuery.data, locale],
  )

  const avatarUrl = useMemo(() => {
    if (!profile) return ""
    const u = profile.user
    const url = u.avatar_url?.trim()
    if (url) return url
    return dicebearAvatar(displayName(u))
  }, [profile])

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <BackLink />
        <div className="py-8 text-sm text-muted-foreground">
          {t("profile.loading")}
        </div>
      </div>
    )
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <BackLink />
        <div className="py-8 text-sm text-red-600">{t("profile.notFound")}</div>
      </div>
    )
  }

  const u = profile.user
  const canToggleFollow = profile.is_following !== null

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <BackLink />

      <header className="modern-card mb-6 flex flex-col gap-4 border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-start">
        <img
          src={avatarUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-full border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {displayName(u)}
              </h1>
              {u.username ? (
                <p className="text-muted-foreground text-sm">@{u.username}</p>
              ) : null}
              {u.bio?.trim() ? (
                <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {u.bio.trim()}
                </p>
              ) : null}
              {isSelf ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("profile.selfHint")}
                </p>
              ) : null}
            </div>
            {canToggleFollow ? (
              <button
                type="button"
                disabled={followMutation.isPending}
                onClick={() => followMutation.mutate()}
                className={
                  profile.is_following
                    ? "rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    : "rounded-md bg-[#82ba00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#72a400]"
                }
              >
                {profile.is_following ? t("profile.unfollow") : t("profile.follow")}
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden />
              <strong className="text-foreground">{profile.followers_count}</strong>{" "}
              {t("profile.followers")}
            </span>
            <span>
              <strong className="text-foreground">{profile.following_count}</strong>{" "}
              {t("profile.following")}
            </span>
          </div>
        </div>
      </header>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="posts">{t("profile.tabPosts")}</TabsTrigger>
          <TabsTrigger value="answered">{t("profile.tabAnswered")}</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-0">
          {postsQuery.isLoading ? (
            <div className="py-6 text-sm text-muted-foreground">
              {t("feed.loading")}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">
              {t("feed.empty")}
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>
        <TabsContent value="answered" className="mt-0">
          {answeredQuery.isLoading ? (
            <div className="py-6 text-sm text-muted-foreground">
              {t("feed.loading")}
            </div>
          ) : answered.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">
              {t("feed.empty")}
            </div>
          ) : (
            answered.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BackLink() {
  const { t } = useLocale()
  return (
    <Link
      to="/"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {t("post.backHome")}
    </Link>
  )
}
