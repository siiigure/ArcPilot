import type { Post, Topic } from "@/types"

export const DEMO_TOPICS: Topic[] = [
  {
    id: "gis",
    name: "GIS 与空间分析",
    icon: "Laptop",
    color: "text-emerald-600",
  },
  { id: "remote", name: "遥感影像", icon: "Film", color: "text-sky-600" },
  { id: "data", name: "数据工程", icon: "BookOpen", color: "text-amber-600" },
]

export const DEMO_POSTS: Post[] = [
  {
    id: "1",
    title: "如何在 PostGIS 里做高效的空间索引？",
    content:
      "建议先确认数据坐标系与查询模式，再选用 **GIST** 与合适的 `ST_` 谓词。下面是一个最小示例……",
    author: {
      name: "ArcPilot",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=arc",
      bio: "GIS / 全栈",
      isFollowing: true,
    },
    timestamp: "2 小时前",
    upvotes: 128,
    comments: 24,
    shares: 3,
  },
  {
    id: "2",
    title: "矢量切片 vs 栅格切片：选型笔记",
    content: "从更新频率、带宽与样式可控性三方面对比……",
    author: {
      name: "Demo User",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
      bio: "制图与可视化",
    },
    timestamp: "昨天",
    upvotes: 56,
    comments: 12,
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
  },
]
