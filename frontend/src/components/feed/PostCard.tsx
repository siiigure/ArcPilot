import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  Copy,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Share2,
  UserMinus,
  UserPlus,
} from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"

import { UsersService } from "@/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/contexts/locale-context"
import useAuth from "@/hooks/useAuth"
import { hidePostId } from "@/lib/hidden-posts"
import type { Post } from "@/types"

interface PostCardProps {
  post: Post
  onPostHidden?: () => void
  /** 论坛列极窄时的标题列表态 */
  compact?: boolean
}

export const PostCard = ({
  post,
  onPostHidden,
  compact = false,
}: PostCardProps) => {
  const { t } = useLocale()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const authorId = post.author.id ?? null
  const isSelf = !!(user && authorId && user.id === authorId)

  const profileQuery = useQuery({
    queryKey: ["userProfile", authorId],
    queryFn: () => UsersService.getUserProfile({ userId: authorId! }),
    enabled: menuOpen && !!authorId && !isSelf,
  })

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!authorId) return
      const following = profileQuery.data?.is_following
      if (following) {
        await UsersService.unfollowUser({ userId: authorId })
      } else {
        await UsersService.followUser({ userId: authorId })
      }
    },
    onSuccess: async () => {
      if (authorId) {
        await queryClient.invalidateQueries({
          queryKey: ["userProfile", authorId],
        })
      }
    },
  })

  const copyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`
    void navigator.clipboard.writeText(url)
    toast.success(t("post.copyDone"))
  }

  const report = () => {
    toast.success(t("post.reportThanks"))
  }

  const notInterested = () => {
    hidePostId(post.id)
    onPostHidden?.()
    toast.message(t("post.hiddenToast"))
  }

  const toggleFollow = () => {
    if (!authorId || isSelf) return
    followMutation.mutate()
  }

  const following = profileQuery.data?.is_following === true

  if (compact) {
    return (
      <article className="border-b border-border py-2 last:border-b-0">
        <Link
          to="/post/$postId"
          params={{ postId: post.id }}
          className="line-clamp-2 text-sm font-semibold text-foreground hover:underline"
        >
          {post.title}
        </Link>
      </article>
    )
  }

  return (
    <article className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-colors dark:border-[#3e4042] dark:bg-[#242526]">
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5">
              {post.author.id ? (
                <Link
                  to="/u/$userId"
                  params={{ userId: post.author.id }}
                  className="text-sm font-bold hover:underline dark:text-white"
                >
                  {post.author.name}
                </Link>
              ) : (
                <span className="text-sm font-bold dark:text-white">
                  {post.author.name}
                </span>
              )}
              {post.author.isFollowing && (
                <span className="cursor-pointer text-sm font-medium text-blue-500 hover:underline">
                  Follow
                </span>
              )}
            </div>
            {post.author.bio ? (
              <span className="line-clamp-2 text-[12px] leading-snug text-gray-500 dark:text-gray-400">
                {post.author.bio}
              </span>
            ) : null}
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {post.timestamp}
            </span>
          </div>
        </div>

        <h2 className="mb-2 cursor-pointer text-lg leading-tight font-bold decoration-gray-400 hover:underline dark:text-white">
          <Link to="/post/$postId" params={{ postId: post.id }}>
            {post.title}
          </Link>
        </h2>

        <div className="mb-3 text-[15px] leading-normal text-gray-700 dark:text-[#e4e6eb]">
          <ReactMarkdown>{post.content}</ReactMarkdown>
          {post.content.length > 150 && (
            <span className="ml-1 cursor-pointer text-gray-400 hover:underline dark:text-gray-500">
              (more)
            </span>
          )}
        </div>

        {post.image && (
          <div className="-mx-4 mb-4 border-y border-gray-100 dark:border-[#3e4042]">
            <img
              src={post.image}
              alt="Post content"
              className="max-h-[500px] w-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-1 pt-1 text-gray-500 dark:text-gray-400">
          <ActionButton
            icon={<MessageSquare className="h-4 w-4" />}
            label={post.comments}
            to="/post/$postId"
            params={{ postId: post.id }}
          />
          {post.shares !== undefined && (
            <ActionButton
              icon={<Share2 className="h-4 w-4" />}
              label={post.shares}
            />
          )}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#3a3b3c]"
                aria-label={t("post.menuMore")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => copyLink()}>
                <Copy className="mr-2 h-4 w-4" />
                {t("post.menuCopyLink")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => report()}>
                <Flag className="mr-2 h-4 w-4" />
                {t("post.menuReport")}
              </DropdownMenuItem>
              {authorId && !isSelf ? (
                <DropdownMenuItem
                  disabled={followMutation.isPending || profileQuery.isLoading}
                  onSelect={() => toggleFollow()}
                >
                  {following ? (
                    <UserMinus className="mr-2 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {following ? t("post.menuUnfollow") : t("post.menuFollow")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => notInterested()}>
                {t("post.menuNotInterested")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}

function ActionButton({
  icon,
  label,
  to,
  params,
}: {
  icon: ReactNode
  label: number
  to?: "/post/$postId"
  params?: { postId: string }
}) {
  if (to && params) {
    return (
      <Link
        to={to}
        params={params}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#3a3b3c]"
      >
        {icon}
        <span>{formatNumber(label)}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#3a3b3c]"
    >
      {icon}
      <span>{formatNumber(label)}</span>
    </button>
  )
}

function formatNumber(num: number) {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}
