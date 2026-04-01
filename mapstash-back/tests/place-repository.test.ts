import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { defaultPlaces } from '../../shared/default-places'
import {
  createPlace,
  deletePlace,
  listPlaces,
  updatePlace,
} from '../src/lib/place-repository'

type GlobalWithDatabase = typeof globalThis & {
  mapstashDb?: {
    close: () => void
  }
}

let tempDir = ''

function resetDatabaseConnection() {
  const globalWithDatabase = globalThis as GlobalWithDatabase
  globalWithDatabase.mapstashDb?.close()
  delete globalWithDatabase.mapstashDb
}

describe('place-repository', () => {
  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'mapstash-back-test-'))
    process.env.MAPSTASH_DB_PATH = path.join(tempDir, 'mapstash.sqlite')
    resetDatabaseConnection()
  })

  afterEach(() => {
    resetDatabaseConnection()
    delete process.env.MAPSTASH_DB_PATH

    if (tempDir) {
      rmSync(tempDir, { force: true, recursive: true })
      tempDir = ''
    }
  })

  it('seeds a new database with the default places', () => {
    const places = listPlaces()

    assert.equal(places.length, defaultPlaces.length)
    assert.deepEqual(
      places.map((place) => place.name).sort(),
      defaultPlaces.map((place) => place.name).sort(),
    )
    assert.ok(places.every((place) => place.id > 0))
  })

  it('creates, updates, and deletes a place in SQLite', () => {
    const createdPlace = createPlace({
      name: '  Folderol  ',
      address: ' 10 Rue du Grand Prieure, Paris ',
      tags: [' wine ', 'wine', 'small plates'],
      position: [48.8671, 2.3674],
    })

    assert.deepEqual(createdPlace.tags, ['wine', 'small plates'])
    assert.equal(createdPlace.name, 'Folderol')
    assert.equal(createdPlace.address, '10 Rue du Grand Prieure, Paris')

    const updatedPlace = updatePlace(createdPlace.id, {
      name: 'Folderol Updated',
      address: '11 Rue du Grand Prieure, Paris',
      tags: ['cocktails'],
      position: [48.8672, 2.3675],
    })

    assert.deepEqual(updatedPlace, {
      id: createdPlace.id,
      name: 'Folderol Updated',
      address: '11 Rue du Grand Prieure, Paris',
      tags: ['cocktails'],
      position: [48.8672, 2.3675],
    })
    assert.equal(deletePlace(createdPlace.id), true)
    assert.equal(deletePlace(createdPlace.id), false)
    assert.equal(updatePlace(createdPlace.id, {
      name: 'Missing place',
      address: 'Nowhere',
      tags: ['ghost'],
      position: [0, 0],
    }), null)
  })
})
