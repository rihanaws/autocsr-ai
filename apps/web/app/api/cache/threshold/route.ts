import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { threshold: unknown }
  const threshold = Number(body.threshold)

  if (isNaN(threshold) || threshold < 0.5 || threshold > 1.0) {
    return NextResponse.json({ error: 'threshold must be between 0.50 and 1.00' }, { status: 400 })
  }

  // TODO Week 5: persist to Tenant row in DB
  return NextResponse.json({ threshold })
}
