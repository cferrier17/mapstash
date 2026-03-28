import type { AddressSuggestion } from '../types/geocoding'

const ADDRESS_AUTOCOMPLETE_API_URL = '/api/address-autocomplete'

type ApiErrorResponse = {
  error?: string
}

type SearchAddressesResponse = {
  suggestions?: AddressSuggestion[]
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const searchParams = new URLSearchParams({
    q: query.trim(),
  })
  const requestUrl = `${ADDRESS_AUTOCOMPLETE_API_URL}?${searchParams.toString()}`

  const response = await fetch(requestUrl, { signal })

  if (!response.ok) {
    let apiErrorMessage: string | null = null

    try {
      const data = await parseJsonResponse<ApiErrorResponse>(response)
      apiErrorMessage = data.error ?? null
    } catch {
      apiErrorMessage = null
    }

    throw new Error(
      apiErrorMessage ??
        `Address autocomplete request failed with status ${response.status}`,
    )
    }

  const data = await parseJsonResponse<SearchAddressesResponse>(response)
  return data.suggestions ?? []
}
