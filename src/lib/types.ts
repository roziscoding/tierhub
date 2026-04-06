export interface TierItem {
  id: number
  src: string
}

export interface Tier {
  id: number
  label: string
  color: string
  items: TierItem[]
}
