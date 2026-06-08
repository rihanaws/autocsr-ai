import { NextResponse } from 'next/server'
import type { KnowledgeDocument } from '@/types/knowledge'

export async function GET(): Promise<NextResponse<KnowledgeDocument[]>> {
  // TODO Week 5: query Appwrite Storage + Upstash Vector for tenant documents
  return NextResponse.json([])
}
