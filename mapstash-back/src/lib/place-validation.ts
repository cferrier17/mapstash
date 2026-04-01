import type { PlaceDraft } from '../../../shared/place'

export function parsePlaceId(idParam: string) {
  const parsedId = Number(idParam)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null
  }

  return parsedId
}

export function parsePlaceDraft(value: unknown): PlaceDraft | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Record<string, unknown>
  const { name, address, tags, position } = candidate

  if (typeof name !== 'string' || !name.trim()) {
    return null
  }

  if (typeof address !== 'string' || !address.trim()) {
    return null
  }

  if (
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === 'string' && tag.trim())
  ) {
    return null
  }

  if (
    !Array.isArray(position) ||
    position.length !== 2 ||
    position.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))
  ) {
    return null
  }

  return {
    name: name.trim(),
    address: address.trim(),
    tags: tags.map((tag) => tag.trim()),
    position: [position[0], position[1]],
  }
}
