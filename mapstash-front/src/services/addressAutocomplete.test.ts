import { describe, expect, it, vi } from 'vitest'
import { createAddressSuggestion } from '../../tests/fixtures'
import { jsonResponse, textResponse } from '../../tests/http'
import { searchAddresses } from './addressAutocomplete'

describe('addressAutocomplete service', () => {
  it('queries the API with a trimmed search string', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const signal = new AbortController().signal
    const suggestions = [createAddressSuggestion()]

    fetchSpy.mockResolvedValue(jsonResponse({ suggestions }))

    await expect(searchAddresses('  holybelly  ', signal)).resolves.toEqual(
      suggestions,
    )
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/address-autocomplete?q=holybelly',
      { signal },
    )
  })

  it('returns an empty array when the payload has no suggestions field', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValue(jsonResponse({}))

    await expect(searchAddresses('paris')).resolves.toEqual([])
  })

  it('throws the API error message when autocomplete fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValue(
      jsonResponse(
        { error: 'Autocomplete provider unavailable' },
        {
          status: 503,
        },
      ),
    )

    await expect(searchAddresses('paris')).rejects.toThrow(
      'Autocomplete provider unavailable',
    )
  })

  it('falls back to the HTTP status when the error response is not JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValue(
      textResponse('service unavailable', {
        status: 502,
      }),
    )

    await expect(searchAddresses('paris')).rejects.toThrow(
      'Address autocomplete request failed with status 502',
    )
  })
})
