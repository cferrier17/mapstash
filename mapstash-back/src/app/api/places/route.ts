import { NextRequest, NextResponse } from 'next/server'
import { createPlace, listPlaces } from '@/lib/place-repository'
import { parsePlaceDraft } from '@/lib/place-validation'

export const runtime = 'nodejs'

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
