import type { PostPublic } from "@/client"
import type { Locale } from "@/i18n/messages"
import { formatRelativeTime } from "@/i18n/messages"
import type { Post } from "@/types"

export function dicebearAvatar(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

export function mapPostPublicToFeedPost(p: PostPublic, locale: Locale): Post {
  const authorName = p.author.name || "Unknown"
  const avatar =
    p.author.avatar && p.author.avatar.trim().length > 0
      ? p.author.avatar
      : dicebearAvatar(authorName)

  return {
    id: p.id,
    title: p.title,
    content: p.content,
    author: {
      id: p.author.id ?? undefined,
      name: authorName,
      avatar,
      bio: p.author.bio ?? undefined,
    },
    timestamp: formatRelativeTime(p.timestamp, locale),
    comments: p.comments,
  }
}
