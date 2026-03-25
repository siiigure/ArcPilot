import {
  MessageSquare,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  X,
} from "lucide-react"
import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"

import { usePostActions } from "@/hooks/use-post-actions"
import type { Post } from "@/types"

interface PostCardProps {
  post: Post
}

export const PostCard = ({ post }: PostCardProps) => {
  const { handleUpvote, isUpvoting } = usePostActions()

  return (
    <article className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-colors dark:border-[#3e4042] dark:bg-[#242526]">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="cursor-pointer text-sm font-bold hover:underline dark:text-white">
                  {post.author.name}
                </span>
                {post.author.isFollowing && (
                  <span className="cursor-pointer text-sm font-medium text-blue-500 hover:underline">
                    Follow
                  </span>
                )}
              </div>
              <span className="line-clamp-1 text-[12px] leading-tight text-gray-500 dark:text-gray-400">
                {post.author.bio}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {post.timestamp}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-[#3a3b3c]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mb-2 cursor-pointer text-lg leading-tight font-bold decoration-gray-400 hover:underline dark:text-white">
          {post.title}
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

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 dark:border-[#3e4042] dark:bg-[#3a3b3c]/50">
            <button
              type="button"
              onClick={() => handleUpvote(post.id)}
              disabled={isUpvoting}
              className="group flex items-center gap-2 border-r border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 disabled:opacity-50 dark:border-[#3e4042] dark:hover:bg-[#3a3b3c]"
            >
              <ThumbsUp className="h-4 w-4 text-gray-500 group-hover:text-[#82ba00] dark:text-gray-400" />
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Upvote · {formatNumber(post.upvotes)}
              </span>
            </button>
            <button
              type="button"
              className="group px-3 py-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-[#3a3b3c]"
            >
              <ThumbsUp className="h-4 w-4 rotate-180 text-gray-500 group-hover:text-red-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <ActionButton
              icon={<MessageSquare className="h-4 w-4" />}
              label={post.comments}
            />
            {post.shares !== undefined && (
              <ActionButton
                icon={<Share2 className="h-4 w-4" />}
                label={post.shares}
              />
            )}
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#3a3b3c]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function ActionButton({ icon, label }: { icon: ReactNode; label: number }) {
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
