import { useCallback, useState } from "react"

/** 动态/帖子交互占位，后续可对接 API */
export function usePostActions() {
  const [isUpvoting, setIsUpvoting] = useState(false)

  const handleUpvote = useCallback(async (_postId: string) => {
    setIsUpvoting(true)
    try {
      await new Promise((r) => setTimeout(r, 280))
    } finally {
      setIsUpvoting(false)
    }
  }, [])

  return { handleUpvote, isUpvoting }
}
