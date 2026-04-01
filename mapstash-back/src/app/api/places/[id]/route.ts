import { NextRequest, NextResponse } from 'next/server'
import {
  deletePlace,
  updatePlace,
} from '@/lib/place-repository'
import {
  parsePlaceDraft,
  parsePlaceId,
} from '@/lib/place-validation'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
  }>
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
