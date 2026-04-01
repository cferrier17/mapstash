import { describe, expect, it, vi } from 'vitest'
import { createPlace as createPlaceFixture } from '../../tests/fixtures'
import { jsonResponse, textResponse } from '../../tests/http'
import {
  createPlace,
  deletePlace,
  fetchPlaces,
  PlacesApiError,
  updatePlace,
} from './places'

describe('places service', () => {
  it('fetches places from the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const signal = new AbortController().signal
    const places = [
      createPlaceFixture(),
      createPlaceFixture({
        id: 2,
        name: 'Septime',
      }),
    ]

    fetchSpy.mockResolvedValue(jsonResponse({ places }))

    await expect(fetchPlaces(signal)).resolves.toEqual(places)
    expect(fetchSpy).toHaveBeenCalledWith('/api/places', { signal })
  })

  it('wraps network failures in a PlacesApiError', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockRejectedValue(new Error('network down'))

    await expect(fetchPlaces()).rejects.toMatchObject({
      name: 'PlacesApiError',
      code: 'network',
      message:
        'Saved places backend is unavailable. Start mapstash-back on http://localhost:3000 and try again.',
    })
  })

  it('surfaces API error messages when loading places fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValue(
      jsonResponse(
        { error: 'Database unavailable' },
        {
          status: 503,
        },
      ),
    )

    await expect(fetchPlaces()).rejects.toMatchObject({
      name: 'PlacesApiError',
      code: 'http',
      status: 503,
      message: 'Database unavailable',
    })
  })

  it('treats a proxy 502 as a backend availability error', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValue(
      textResponse('Bad Gateway', {
        status: 502,
      }),
    )

    await expect(fetchPlaces()).rejects.toMatchObject({
      name: 'PlacesApiError',
      code: 'http',
      status: 502,
      message:
        'Saved places backend is unavailable. Start mapstash-back on http://localhost:3000 and try again.',
    })
  })

  it('creates a place with a POST request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const place = createPlaceFixture({ id: 7 })
    const draft = {
      name: place.name,
      address: place.address,
      tags: place.tags,
      position: place.position,
    }

    fetchSpy.mockResolvedValue(jsonResponse({ place }))

    await expect(createPlace(draft)).resolves.toEqual(place)
    expect(fetchSpy).toHaveBeenCalledWith('/api/places', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    })
  })

  it('throws when the create response is missing its place payload', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const draft = {
      name: 'Holybelly',
      address: '5 Rue Lucien Sampaix, Paris',
      tags: ['brunch', 'coffee'],
      position: [48.8701, 2.3652] as [number, number],
    }

    fetchSpy.mockResolvedValue(jsonResponse({}))

    await expect(createPlace(draft)).rejects.toThrow(
      'Creating place failed: missing place payload',
    )
  })

  it('updates a place with a PUT request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const updatedPlace = createPlaceFixture({
      id: 3,
      name: 'Folderol',
    })
    const draft = {
      name: updatedPlace.name,
      address: updatedPlace.address,
      tags: updatedPlace.tags,
      position: updatedPlace.position,
    }

    fetchSpy.mockResolvedValue(jsonResponse({ place: updatedPlace }))

    await expect(updatePlace(3, draft)).resolves.toEqual(updatedPlace)
    expect(fetchSpy).toHaveBeenCalledWith('/api/places/3', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    })
  })

  it('uses the fallback error message when delete fails without JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValue(
      textResponse('server error', {
        status: 500,
      }),
    )

    await expect(deletePlace(4)).rejects.toEqual(
      new PlacesApiError('Unable to delete the place.', {
        code: 'http',
        status: 500,
      }),
    )
  })
})
