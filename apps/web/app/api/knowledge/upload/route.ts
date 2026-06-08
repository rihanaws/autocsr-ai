import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['.pdf', '.txt', '.md', '.csv']

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_TYPES.includes(ext)) {
    return NextResponse.json({ error: `File type ${ext} not allowed` }, { status: 400 })
  }

  // TODO Week 5: store to Appwrite Storage, chunk, embed to Upstash Vector
  return NextResponse.json({
    id: randomUUID(),
    status: 'PROCESSING',
    name: name ?? file.name,
  })
}
