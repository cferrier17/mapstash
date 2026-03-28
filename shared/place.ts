export type Place = {
  id: number
  name: string
  address: string
  tags: string[]
  position: [number, number]
}

export type PlaceDraft = Omit<Place, 'id'>
