import { NextResponse } from 'next/server'

export async function POST() {
  // TODO Week 5: schedule tenant deprovisioning
  return NextResponse.json({ scheduled: true })
}
