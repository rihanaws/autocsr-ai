import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const ALLOWED_EXTS = ['.pdf', '.txt', '.md', '.csv']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string | null) ?? null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: `File type ${ext} not allowed` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
  }

  const doc = await db.knowledgeDocument.create({
    data: {
      tenantId,
      name:      name ?? file.name,
      type:      file.type || 'text/plain',
      sizeBytes: file.size,
      status:    'PROCESSING',
    },
  })

  return NextResponse.json({ id: doc.id, status: doc.status, name: doc.name })
}
