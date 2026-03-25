export interface Topic {
  id: string
  name: string
  icon?: string
  color?: string
}

export interface PostAuthor {
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
  upvotes: number
  comments: number
  shares?: number
  image?: string
}
