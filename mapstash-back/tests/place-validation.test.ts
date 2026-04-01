import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  parsePlaceDraft,
  parsePlaceId,
} from '../src/lib/place-validation'

describe('place-validation', () => {
  it('parses a valid place id', () => {
    assert.equal(parsePlaceId('42'), 42)
  })

  it('rejects invalid place ids', () => {
    assert.equal(parsePlaceId('0'), null)
    assert.equal(parsePlaceId('-1'), null)
    assert.equal(parsePlaceId('1.5'), null)
    assert.equal(parsePlaceId('abc'), null)
  })

  it('normalizes a valid place draft payload', () => {
    assert.deepEqual(
      parsePlaceDraft({
        name: '  Holybelly  ',
        address: ' 5 Rue Lucien Sampaix, Paris ',
        tags: [' brunch ', 'coffee'],
        position: [48.8701, 2.3652],
      }),
      {
        name: 'Holybelly',
        address: '5 Rue Lucien Sampaix, Paris',
        tags: ['brunch', 'coffee'],
        position: [48.8701, 2.3652],
      },
    )
  })

  it('rejects malformed place drafts', () => {
    assert.equal(
      parsePlaceDraft({
        name: 'Holybelly',
        address: 'Paris',
        tags: ['coffee', ''],
        position: [48.8701, 2.3652],
      }),
      null,
    )

    assert.equal(
      parsePlaceDraft({
        name: 'Holybelly',
        address: 'Paris',
        tags: ['coffee'],
        position: ['48.8701', 2.3652],
      }),
      null,
    )
  })
})
