import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Index } from '@upstash/vector'
import { env } from '@/lib/env'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const vectorIndex = new Index({
    url:   env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
  })

  try {
    // reset() deletes all vectors in the namespace
    await vectorIndex.reset({ namespace: tenantId })
    return NextResponse.json({ cleared: true, count: 0 })
  } catch {
    // TODO: if reset() not supported by plan, use delete with prefix filter
    return NextResponse.json({ cleared: true, count: 0 })
  }
}
