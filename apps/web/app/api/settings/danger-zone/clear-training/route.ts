import { NextResponse } from 'next/server'

export async function POST() {
  // TODO Week 5: delete all TrainingExample rows for tenant
  return NextResponse.json({ scheduled: true })
}
