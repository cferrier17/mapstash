import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAddressSuggestion } from '../../tests/fixtures'
import { useAddressAutocomplete } from './useAddressAutocomplete'

const mockSearchAddresses = vi.fn()

vi.mock('../services/addressAutocomplete', () => ({
  searchAddresses: (...args: unknown[]) => mockSearchAddresses(...args),
}))

describe('useAddressAutocomplete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSearchAddresses.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for the debounce before searching addresses', async () => {
    const suggestion = createAddressSuggestion()
    mockSearchAddresses.mockResolvedValue([suggestion])

    const { result } = renderHook(() =>
      useAddressAutocomplete({
        enabled: true,
        query: 'paris',
      }),
    )

    expect(mockSearchAddresses).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.suggestions).toEqual([suggestion])
    expect(mockSearchAddresses).toHaveBeenCalledWith('paris', expect.any(AbortSignal))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('')
  })

  it('clears suggestions when the hook is disabled', async () => {
    const suggestion = createAddressSuggestion()
    mockSearchAddresses.mockResolvedValue([suggestion])

    const { result, rerender } = renderHook(
      ({ enabled, query }) =>
        useAddressAutocomplete({
          enabled,
          query,
        }),
      {
        initialProps: {
          enabled: true,
          query: 'paris',
        },
      },
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.suggestions).toEqual([suggestion])

    rerender({
      enabled: false,
      query: 'paris',
    })

    expect(result.current.suggestions).toEqual([])
    expect(result.current.error).toBe('')
    expect(result.current.isLoading).toBe(false)
  })

  it('suppresses the next search when requested', async () => {
    mockSearchAddresses.mockResolvedValue([createAddressSuggestion()])

    const { result, rerender } = renderHook(
      ({ query }) =>
        useAddressAutocomplete({
          enabled: true,
          query,
        }),
      {
        initialProps: {
          query: 'par',
        },
      },
    )

    act(() => {
      result.current.suppressNextSearch()
    })

    rerender({
      query: 'paris',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(mockSearchAddresses).not.toHaveBeenCalled()
  })

  it('exposes a readable error when the search fails', async () => {
    mockSearchAddresses.mockRejectedValue(new Error('Autocomplete down'))

    const { result } = renderHook(() =>
      useAddressAutocomplete({
        enabled: true,
        query: 'paris',
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.error).toBe('Autocomplete down')
    expect(result.current.suggestions).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })
})
