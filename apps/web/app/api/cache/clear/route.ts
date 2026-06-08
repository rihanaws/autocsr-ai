import { NextResponse } from 'next/server'

export async function DELETE() {
  // TODO Week 5: call Upstash Vector delete all for tenant namespace
  return NextResponse.json({ cleared: true })
}
