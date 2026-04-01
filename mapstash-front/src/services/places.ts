import type { Place, PlaceDraft } from '../types/place'

const PLACES_API_URL = '/api/places'
const DEFAULT_BACKEND_URL = 'http://localhost:3000'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? DEFAULT_BACKEND_URL
const BACKEND_UNAVAILABLE_MESSAGE =
  `Saved places backend is unavailable. Start mapstash-back on ${BACKEND_URL} and try again.`

type ApiErrorResponse = {
  error?: string
}

type PlacesResponse = {
  places?: Place[]
}

type PlaceResponse = {
  place?: Place
}

export class PlacesApiError extends Error {
  status?: number
  code: 'network' | 'http'

  constructor(
    message: string,
    options: {
      code: 'network' | 'http'
      status?: number
    },
  ) {
    super(message)
    this.name = 'PlacesApiError'
    this.code = options.code
    this.status = options.status
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

async function parseApiError(response: Response, fallbackMessage: string) {
  if (response.status === 502) {
    return BACKEND_UNAVAILABLE_MESSAGE
  }

  try {
    const data = await parseJsonResponse<ApiErrorResponse>(response)
    return data.error ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

async function performPlacesRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new PlacesApiError(BACKEND_UNAVAILABLE_MESSAGE, {
      code: 'network',
    })
  }
}

export async function fetchPlaces(signal?: AbortSignal): Promise<Place[]> {
  const response = await performPlacesRequest(PLACES_API_URL, { signal })

  if (!response.ok) {
    throw new PlacesApiError(
      await parseApiError(response, 'Unable to load saved places.'),
      {
        code: 'http',
        status: response.status,
      },
    )
  }

  const data = await parseJsonResponse<PlacesResponse>(response)
  return data.places ?? []
}

export async function createPlace(place: PlaceDraft): Promise<Place> {
  const response = await performPlacesRequest(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(place),
  })

  if (!response.ok) {
    throw new PlacesApiError(
      await parseApiError(response, 'Unable to create the place.'),
      {
        code: 'http',
        status: response.status,
      },
    )
  }

  const data = await parseJsonResponse<PlaceResponse>(response)

  if (!data.place) {
    throw new Error('Creating place failed: missing place payload')
  }

  return data.place
}

export async function updatePlace(id: number, place: PlaceDraft): Promise<Place> {
  const response = await performPlacesRequest(`${PLACES_API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(place),
  })

  if (!response.ok) {
    throw new PlacesApiError(
      await parseApiError(response, 'Unable to update the place.'),
      {
        code: 'http',
        status: response.status,
      },
    )
  }

  const data = await parseJsonResponse<PlaceResponse>(response)

  if (!data.place) {
    throw new Error('Updating place failed: missing place payload')
  }

  return data.place
}

export async function deletePlace(id: number): Promise<void> {
  const response = await performPlacesRequest(`${PLACES_API_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new PlacesApiError(
      await parseApiError(response, 'Unable to delete the place.'),
      {
        code: 'http',
        status: response.status,
      },
    )
  }
}
