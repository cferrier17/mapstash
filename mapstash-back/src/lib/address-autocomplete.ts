import {
  MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH,
  type AddressSuggestion,
} from '../../../shared/geocoding'

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

type NominatimSearchResult = {
  address?: {
    city?: string
    country?: string
    county?: string
    house_number?: string
    postcode?: string
    road?: string
    state?: string
    suburb?: string
    town?: string
    village?: string
  }
  display_name: string
  lat: string
  lon: string
  name?: string
  place_id: number
}

const DEFAULT_RESULT_LIMIT = 5
const MAX_RESULT_LIMIT = 10
const PHOTON_API_URL = process.env.PHOTON_API_URL ?? 'https://photon.komoot.io/api'
const NOMINATIM_API_URL =
  process.env.NOMINATIM_API_URL ?? 'https://nominatim.openstreetmap.org/search'
const ADDRESS_AUTOCOMPLETE_USER_AGENT =
  process.env.ADDRESS_AUTOCOMPLETE_USER_AGENT ?? 'mapstash/0.1'

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

function dedupeSuggestions(suggestions: AddressSuggestion[]) {
  const seenSuggestionIds = new Set<string>()

  return suggestions.filter((suggestion) => {
    if (seenSuggestionIds.has(suggestion.id)) {
      return false
    }

    seenSuggestionIds.add(suggestion.id)
    return true
  })
}

async function searchPhotonAddresses(
  query: string,
  limit?: string,
): Promise<AddressSuggestion[]> {
  const searchParams = new URLSearchParams({
    q: query,
    limit: String(normalizeLimit(limit)),
  })

  const response = await fetch(`${PHOTON_API_URL}?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': ADDRESS_AUTOCOMPLETE_USER_AGENT,
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

function toNominatimSuggestion(
  result: NominatimSearchResult,
  index: number,
): AddressSuggestion | null {
  const lat = Number(result.lat)
  const lng = Number(result.lon)

  if (Number.isNaN(lat) || Number.isNaN(lng) || !result.display_name) {
    return null
  }

  const fallbackName = result.display_name.split(',')[0]?.trim() || 'Suggested address'

  return {
    id: `nominatim-${result.place_id}-${index}`,
    label: result.display_name,
    name: result.name ?? fallbackName,
    position: [lat, lng],
  }
}

async function searchNominatimAddresses(
  query: string,
  limit?: string,
): Promise<AddressSuggestion[]> {
  const searchParams = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(normalizeLimit(limit)),
  })

  const response = await fetch(
    `${NOMINATIM_API_URL}?${searchParams.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'fr,en;q=0.8',
        'User-Agent': ADDRESS_AUTOCOMPLETE_USER_AGENT,
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`)
  }

  const data = (await response.json()) as NominatimSearchResult[]
  return data
    .map((result, index) => toNominatimSuggestion(result, index))
    .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null)
}

export function shouldSearchAddresses(query: string) {
  return query.trim().length >= MIN_ADDRESS_AUTOCOMPLETE_QUERY_LENGTH
}

export async function searchAddresses(
  query: string,
  limit?: string,
): Promise<AddressSuggestion[]> {
  const trimmedQuery = query.trim()

  if (!shouldSearchAddresses(trimmedQuery)) {
    return []
  }

  try {
    return dedupeSuggestions(await searchPhotonAddresses(trimmedQuery, limit))
  } catch (photonError) {
    console.warn('Photon autocomplete failed, trying Nominatim instead', photonError)
  }

  try {
    return dedupeSuggestions(await searchNominatimAddresses(trimmedQuery, limit))
  } catch (nominatimError) {
    console.error('Nominatim autocomplete failed', nominatimError)
    throw new Error('Both autocomplete providers failed')
  }
}
