import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { defaultPlaces } from '../../../shared/default-places'
import type { Place, PlaceDraft } from '../../../shared/place'

type PlaceRow = {
  id: number
  name: string
  address: string
  tags: string
  lat: number
  lng: number
}

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'mapstash.sqlite')

declare global {
  var mapstashDb: Database.Database | undefined
}

function getDatabasePath() {
  return process.env.MAPSTASH_DB_PATH ?? DEFAULT_DB_PATH
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}

function rowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    tags: JSON.parse(row.tags) as string[],
    position: [row.lat, row.lng],
  }
}

function placeToParams(place: PlaceDraft) {
  return {
    name: place.name.trim(),
    address: place.address.trim(),
    tags: JSON.stringify(normalizeTags(place.tags)),
    lat: place.position[0],
    lng: place.position[1],
  }
}

function seedDatabase(db: Database.Database) {
  const row = db.prepare('SELECT COUNT(*) as count FROM places').get() as {
    count: number
  }

  if (row.count > 0) {
    return
  }

  const insertPlace = db.prepare(`
    INSERT INTO places (name, address, tags, lat, lng)
    VALUES (@name, @address, @tags, @lat, @lng)
  `)

  const insertDefaults = db.transaction((places: PlaceDraft[]) => {
    for (const place of places) {
      insertPlace.run(placeToParams(place))
    }
  })

  insertDefaults(defaultPlaces)
}

function createDatabase() {
  const databasePath = getDatabasePath()

  mkdirSync(path.dirname(databasePath), { recursive: true })

  const db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      tags TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    )
  `)

  seedDatabase(db)

  return db
}

function getDatabase() {
  if (!globalThis.mapstashDb) {
    globalThis.mapstashDb = createDatabase()
  }

  return globalThis.mapstashDb
}

export function listPlaces(): Place[] {
  const db = getDatabase()
  const rows = db
    .prepare(
      `
        SELECT id, name, address, tags, lat, lng
        FROM places
        ORDER BY id DESC
      `,
    )
    .all() as PlaceRow[]

  return rows.map(rowToPlace)
}

export function getPlaceById(id: number): Place | null {
  const db = getDatabase()
  const row = db
    .prepare(
      `
        SELECT id, name, address, tags, lat, lng
        FROM places
        WHERE id = ?
      `,
    )
    .get(id) as PlaceRow | undefined

  return row ? rowToPlace(row) : null
}

export function createPlace(place: PlaceDraft): Place {
  const db = getDatabase()
  const result = db
    .prepare(
      `
        INSERT INTO places (name, address, tags, lat, lng)
        VALUES (@name, @address, @tags, @lat, @lng)
      `,
    )
    .run(placeToParams(place))

  return getPlaceById(Number(result.lastInsertRowid)) as Place
}

export function updatePlace(id: number, place: PlaceDraft): Place | null {
  const db = getDatabase()
  const result = db
    .prepare(
      `
        UPDATE places
        SET name = @name,
            address = @address,
            tags = @tags,
            lat = @lat,
            lng = @lng
        WHERE id = @id
      `,
    )
    .run({
      id,
      ...placeToParams(place),
    })

  if (result.changes === 0) {
    return null
  }

  return getPlaceById(id)
}

export function deletePlace(id: number) {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM places WHERE id = ?').run(id)

  return result.changes > 0
}
