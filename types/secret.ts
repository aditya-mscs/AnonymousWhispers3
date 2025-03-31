export interface Comment {
  id: string
  content: string
  username: string
  createdAt: string
  ipHash?: string
}

export interface Secret {
  id: string
  content: string
  darkness: number
  username: string
  createdAt: Date | string
  comments?: Comment[]
  views?: number
  shares?: number
  ipHash?: string
}

