import { NextRequest, NextResponse } from 'next/server'
import { createPlace, listPlaces } from '@/lib/place-repository'
import type { PlaceDraft } from '../../../../../shared/place'

export const runtime = 'nodejs'

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

export async function GET() {
  try {
    return NextResponse.json({
      places: listPlaces(),
    })
  } catch (error) {
    console.error('Listing places failed', error)

    return NextResponse.json(
      {
        error: 'Unable to load saved places.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    return NextResponse.json(
      {
        place: createPlace(place),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Creating place failed', error)

    return NextResponse.json(
      {
        error: 'Unable to create the place.',
      },
      { status: 500 },
    )
  }
}
