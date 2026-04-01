import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import {
  searchAddresses,
  shouldSearchAddresses,
} from '../src/lib/address-autocomplete'

describe('address-autocomplete', () => {
  let fetchMock: ReturnType<typeof mock.fn<typeof fetch>>
  let warnMock: ReturnType<typeof mock.method<typeof console.warn>>
  let errorMock: ReturnType<typeof mock.method<typeof console.error>>

  beforeEach(() => {
    fetchMock = mock.fn<typeof fetch>()
    warnMock = mock.method(console, 'warn', () => {})
    errorMock = mock.method(console, 'error', () => {})
    globalThis.fetch = fetchMock as typeof fetch
  })

  afterEach(() => {
    warnMock.mock.restore()
    errorMock.mock.restore()
    mock.reset()
  })

  it('skips network calls when the query is too short', async () => {
    assert.equal(shouldSearchAddresses('pa'), false)
    assert.deepEqual(await searchAddresses('pa'), [])
    assert.equal(fetchMock.mock.calls.length, 0)
  })

  it('returns formatted suggestions from Photon', async () => {
    fetchMock.mock.mockImplementationOnce(async (input) => {
      assert.equal(
        input,
        'https://photon.komoot.io/api?q=paris&limit=10',
      )

      return new Response(
        JSON.stringify({
          features: [
            {
              geometry: {
                type: 'Point',
                coordinates: [2.3652, 48.8701],
              },
              properties: {
                name: 'Holybelly',
                street: 'Rue Lucien Sampaix',
                housenumber: '5',
                postcode: '75010',
                city: 'Paris',
                country: 'France',
              },
            },
            {
              geometry: {
                type: 'LineString',
                coordinates: [2.1, 48.8],
              },
              properties: {
                name: 'Ignored',
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    const suggestions = await searchAddresses('  paris  ', '99')

    assert.deepEqual(suggestions, [
      {
        id: 'Holybelly, Rue Lucien Sampaix 5, 75010 Paris, France-48.8701-2.3652-0',
        label: 'Holybelly, Rue Lucien Sampaix 5, 75010 Paris, France',
        name: 'Holybelly',
        position: [48.8701, 2.3652],
      },
    ])
  })

  it('falls back to Nominatim when Photon fails', async () => {
    let callCount = 0

    fetchMock.mock.mockImplementation(async (input) => {
      if (callCount === 0) {
        callCount += 1
        return new Response('Photon down', { status: 503 })
      }

      assert.equal(
        input,
        'https://nominatim.openstreetmap.org/search?q=paris&format=jsonv2&addressdetails=1&limit=5',
      )

      return new Response(
        JSON.stringify([
          {
            place_id: 123,
            display_name: '5 Rue Lucien Sampaix, 75010 Paris, France',
            lat: '48.8701',
            lon: '2.3652',
          },
        ]),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    const suggestions = await searchAddresses('paris')

    assert.deepEqual(suggestions, [
      {
        id: 'nominatim-123-0',
        label: '5 Rue Lucien Sampaix, 75010 Paris, France',
        name: '5 Rue Lucien Sampaix',
        position: [48.8701, 2.3652],
      },
    ])
    assert.equal(warnMock.mock.calls.length, 1)
  })

  it('throws when both providers fail', async () => {
    fetchMock.mock.mockImplementation(async () => {
      return new Response('down', { status: 503 })
    })

    await assert.rejects(
      searchAddresses('paris'),
      new Error('Both autocomplete providers failed'),
    )
    assert.equal(warnMock.mock.calls.length, 1)
    assert.equal(errorMock.mock.calls.length, 1)
  })
})
