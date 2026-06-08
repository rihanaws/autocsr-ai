import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  // TODO Week 5: delete from Appwrite Storage + Upstash Vector
  return NextResponse.json({ deleted: true, id })
}
