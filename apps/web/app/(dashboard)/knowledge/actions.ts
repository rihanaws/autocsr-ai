'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { AgentType } from '@prisma/client'

export async function addKnowledgeChunk(formData: FormData) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const content = formData.get('content') as string
  const source = formData.get('source') as string
  const agentTypeRaw = formData.get('agentType') as string

  if (!content?.trim() || !source) throw new Error('Missing required fields')

  const agentType = agentTypeRaw === 'ALL' ? null : agentTypeRaw as AgentType

  await db.knowledgeChunk.create({
    data: {
      tenantId: session.user.tenantId,
      content: content.trim(),
      source,
      agentType,
    },
  })

  revalidatePath('/knowledge')
}

export async function deleteKnowledgeChunk(id: string) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  await db.knowledgeChunk.delete({
    where: { id, tenantId: session.user.tenantId },
  })

  revalidatePath('/knowledge')
}
