import { useEffect, useRef, useState } from 'react'
import { searchAddresses } from '../services/photon'
import type { AddressSuggestion } from '../types/geocoding'

type UseAddressAutocompleteOptions = {
  enabled: boolean
  query: string
}

type UseAddressAutocompleteResult = {
  error: string
  isLoading: boolean
  suggestions: AddressSuggestion[]
  suppressNextSearch: () => void
}

export function useAddressAutocomplete({
  enabled,
  query,
}: UseAddressAutocompleteOptions): UseAddressAutocompleteResult {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const skipNextSearchRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setSuggestions([])
      setError('')
      setIsLoading(false)
      skipNextSearchRef.current = false
      return
    }

    const trimmedQuery = query.trim()

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }

    if (trimmedQuery.length < 3) {
      setSuggestions([])
      setError('')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setError('')

      try {
        const nextSuggestions = await searchAddresses(
          trimmedQuery,
          controller.signal,
        )
        setSuggestions(nextSuggestions)
      } catch (searchError) {
        if (controller.signal.aborted) {
          return
        }

        console.error(searchError)
        setSuggestions([])
        setError('Photon is unavailable right now. Try again in a moment.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [enabled, query])

  return {
    error,
    isLoading,
    suggestions,
    suppressNextSearch: () => {
      skipNextSearchRef.current = true
    },
  }
}
