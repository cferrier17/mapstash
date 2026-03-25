import type { AddressSuggestion } from '../types/geocoding'

const ADDRESS_AUTOCOMPLETE_API_URL = '/api/address-autocomplete'

type SearchAddressesResponse = {
  suggestions?: AddressSuggestion[]
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
    throw new Error(
      `Address autocomplete request failed with status ${response.status}`,
    )
  }

  const data = (await response.json()) as SearchAddressesResponse
  return data.suggestions ?? []
}
