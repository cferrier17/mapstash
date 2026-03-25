export type AddressSuggestion = {
  id: string
  label: string
  name: string
  position: [number, number]
}

type PhotonFeatureCollection = {
  features: PhotonFeature[]
}

type PhotonFeature = {
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

const DEFAULT_RESULT_LIMIT = 5
const MAX_RESULT_LIMIT = 10
const MIN_QUERY_LENGTH = 3
const PHOTON_API_URL = process.env.PHOTON_API_URL ?? 'https://photon.komoot.io/api'

function formatAddress(properties: PhotonFeature['properties']) {
  const streetLine = [properties.street, properties.housenumber]
    .filter(Boolean)
    .join(' ')
  const cityLine = [properties.postcode, properties.city ?? properties.locality]
    .filter(Boolean)
    .join(' ')

  return [
    properties.name,
    streetLine,
    cityLine,
    properties.district,
    properties.state,
    properties.country,
  ]
    .filter(Boolean)
    .join(', ')
}

function toSuggestion(
  feature: PhotonFeature,
  index: number,
): AddressSuggestion | null {
  if (feature.geometry.type !== 'Point') {
    return null
  }

  const [lng, lat] = feature.geometry.coordinates
  const label = formatAddress(feature.properties)

  if (!label) {
    return null
  }

  return {
    id: `${label}-${lat}-${lng}-${index}`,
    label,
    name:
      feature.properties.name ??
      feature.properties.street ??
      feature.properties.city ??
      'Suggested address',
    position: [lat, lng],
  }
}

function normalizeLimit(limit?: string) {
  const parsedLimit = Number(limit)

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_RESULT_LIMIT
  }

  return Math.min(parsedLimit, MAX_RESULT_LIMIT)
}

export function shouldSearchAddresses(query: string) {
  return query.trim().length >= MIN_QUERY_LENGTH
}

export async function searchAddresses(
  query: string,
  limit?: string,
): Promise<AddressSuggestion[]> {
  const trimmedQuery = query.trim()

  if (!shouldSearchAddresses(trimmedQuery)) {
    return []
  }

  const searchParams = new URLSearchParams({
    q: trimmedQuery,
    limit: String(normalizeLimit(limit)),
  })

  const response = await fetch(`${PHOTON_API_URL}?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Photon request failed with status ${response.status}`)
  }

  const data = (await response.json()) as PhotonFeatureCollection
  return data.features
    .map((feature, index) => toSuggestion(feature, index))
    .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null)
}
