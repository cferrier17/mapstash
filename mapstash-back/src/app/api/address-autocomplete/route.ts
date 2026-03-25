import { NextRequest, NextResponse } from 'next/server'
import { searchAddresses } from '@/lib/address-autocomplete'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''
  const limit = request.nextUrl.searchParams.get('limit') ?? undefined

  try {
    const suggestions = await searchAddresses(query, limit)

    return NextResponse.json({
      suggestions,
    })
  } catch (error) {
    console.error('Address autocomplete request failed', error)

    return NextResponse.json(
      {
        error: 'Address autocomplete is unavailable right now.',
      },
      { status: 502 },
    )
  }
}
