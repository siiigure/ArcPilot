const KEY = "arcpilot_feed_hidden_post_ids"

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === "string"))
  } catch {
    return new Set()
  }
}

export function getHiddenPostIds(): Set<string> {
  return readIds()
}

export function hidePostId(postId: string): void {
  const next = readIds()
  next.add(postId)
  localStorage.setItem(KEY, JSON.stringify([...next]))
}
