export type PhotonFeatureCollection = {
  features: PhotonFeature[]
}

export type PhotonFeature = {
  geometry: {
    coordinates: [number, number]
    type: string
  }
  properties: {
    city?: string
    country?: string
    district?: string
    housenumber?: string
    locality?: string
    name?: string
    postcode?: string
    state?: string
    street?: string
  }
}

export type AddressSuggestion = {
  id: string
  label: string
  name: string
  position: [number, number]
}
