import { useCallback, useState } from "react"

/** 顶栏搜索：后续可对接 `/search` 或带 query 的路由 */
export function useSearch() {
  const [query, setQuery] = useState("")

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q) return
      // 占位：接入真实搜索时在此 navigate
    },
    [query],
  )

  return { query, setQuery, handleSearch }
}
