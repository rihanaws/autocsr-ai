export interface KnowledgeDocument {
  id: string
  name: string
  type: string
  sizeBytes: number
  status: 'PROCESSING' | 'READY' | 'FAILED'
  chunkCount: number
  createdAt: string
}
