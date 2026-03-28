import { NextRequest, NextResponse } from 'next/server'
import {
  deletePlace,
  updatePlace,
} from '@/lib/place-repository'
import type { PlaceDraft } from '../../../../../../shared/place'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parsePlaceId(idParam: string) {
  const parsedId = Number(idParam)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null
  }

  return parsedId
}

function parsePlaceDraft(value: unknown): PlaceDraft | null {
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
    position.some((value) => typeof value !== 'number' || !Number.isFinite(value))
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

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const placeId = parsePlaceId(params.id)

  if (placeId === null) {
    return NextResponse.json(
      {
        error: 'Invalid place id.',
      },
      { status: 400 },
    )
  }

  try {
    const body = (await request.json()) as unknown
    const place = parsePlaceDraft(body)

    if (!place) {
      return NextResponse.json(
        {
          error: 'Invalid place payload.',
        },
        { status: 400 },
      )
    }

    const updatedPlace = updatePlace(placeId, place)

    if (!updatedPlace) {
      return NextResponse.json(
        {
          error: 'Place not found.',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      place: updatedPlace,
    })
  } catch (error) {
    console.error('Updating place failed', error)

    return NextResponse.json(
      {
        error: 'Unable to update the place.',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const params = await context.params
  const placeId = parsePlaceId(params.id)

  if (placeId === null) {
    return NextResponse.json(
      {
        error: 'Invalid place id.',
      },
      { status: 400 },
    )
  }

  if (!deletePlace(placeId)) {
    return NextResponse.json(
      {
        error: 'Place not found.',
      },
      { status: 404 },
    )
  }

  return new NextResponse(null, { status: 204 })
}
