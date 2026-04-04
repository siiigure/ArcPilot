import { useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"

/** 顶栏搜索：跳转 `/search?q=`，由搜索结果页调用 `PostsService.searchPosts` */
export function useSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q) return
      void navigate({ to: "/search", search: { q } })
    },
    [query, navigate],
  )

  return { query, setQuery, handleSearch }
}
