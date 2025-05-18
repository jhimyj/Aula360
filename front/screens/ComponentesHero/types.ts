export interface Character {
  id: string
  name: string
  image: any
  description: string
  video?: any
  videoPath?: string
  background?: string[]
  stats?: {
    strength: number
    wisdom: number
    agility: number
    defense: number
  }
  class?: string
  level?: number
  rarity?: string
  element?: string
  abilities?: string[]
  backstory?: string
}
