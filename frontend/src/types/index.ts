export interface Topic {
  id: string
  name: string
  icon?: string
  color?: string
}

export interface PostAuthor {
  /** 用户 public_id，用于跳转资料页 */
  id?: string | null
  name: string
  avatar: string
  bio?: string
  isFollowing?: boolean
}

export interface Post {
  id: string
  title: string
  content: string
  author: PostAuthor
  timestamp: string
  comments: number
  shares?: number
  image?: string
}
