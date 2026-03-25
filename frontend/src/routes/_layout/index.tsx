import { createFileRoute } from "@tanstack/react-router"

import { PostCard } from "@/components/feed/PostCard"
import { QuickPostBox } from "@/components/feed/QuickPostBox"
import { DEMO_POSTS } from "@/data/mock-feed"

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
  return (
    <div className="mx-auto max-w-2xl pb-8">
      <QuickPostBox />
      {DEMO_POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
