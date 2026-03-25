import type {
  AddressSuggestion,
  PhotonFeature,
  PhotonFeatureCollection,
} from '../types/geocoding'

const PHOTON_API_URL = '/api/photon'

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

function toSuggestion(feature: PhotonFeature, index: number): AddressSuggestion | null {
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

export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 3) {
    return []
  }

  const searchParams = new URLSearchParams({
    q: trimmedQuery,
    limit: '5',
  })
  const requestUrl = `${PHOTON_API_URL}?${searchParams.toString()}`

  const response = await fetch(requestUrl, { signal })

  if (!response.ok) {
    throw new Error(`Photon request failed with status ${response.status}`)
  }

  const data = (await response.json()) as PhotonFeatureCollection
  return data.features
    .map((feature, index) => toSuggestion(feature, index))
    .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null)
}
