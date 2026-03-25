import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'mapstash-back',
    timestamp: new Date().toISOString(),
  })
}
