/** 侧栏话题行：无后端 icon 字段时用 slug 稳定映射样式 */
const ICON_KEYS = [
  "Laptop",
  "Film",
  "BookOpen",
  "Music",
  "Heart",
  "Utensils",
  "UtensilsCrossed",
] as const

const COLORS = [
  "text-sky-600",
  "text-emerald-600",
  "text-amber-600",
  "text-violet-600",
  "text-rose-600",
  "text-cyan-600",
  "text-orange-600",
] as const

function slugHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (h + slug.charCodeAt(i) * (i + 1)) % 10007
  }
  return h
}

export function topicSlugToIconKey(slug: string): (typeof ICON_KEYS)[number] {
  const i = Math.abs(slugHash(slug)) % ICON_KEYS.length
  return ICON_KEYS[i]!
}

export function topicSlugToColorClass(slug: string): string {
  const i = Math.abs(slugHash(`${slug}_c`)) % COLORS.length
  return COLORS[i]!
}
