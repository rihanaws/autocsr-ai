import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { env } from "@/lib/env"

const MAX_BYTES = 500_000
const ALLOWED_MIME = new Set([
  "text/plain",
  "text/markdown",
  "application/json",
])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tenantId = session.user.tenantId

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 })

  const file = form.get("file") as File | null
  if (!file)           return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large — max 500 KB" }, { status: 413 })
  if (!ALLOWED_MIME.has(file.type))
    return NextResponse.json(
      { error: "Unsupported file type — use .txt .md .json" },
      { status: 415 }
    )

  const text = await file.text()
  if (!text.trim())
    return NextResponse.json({ error: "File content is empty" }, { status: 400 })

  const doc = await db.knowledgeDocument.create({
    data: {
      tenantId,
      name:      file.name,
      type:      file.type,
      sizeBytes: file.size,
      status:    "PROCESSING",
      chunkCount: 0,
    },
  })

  // Fire-and-forget — do not await
  triggerEmbed({ tenantId, documentId: doc.id, text, name: file.name }).catch(
    async (err) => {
      console.error("[knowledge/upload] embed trigger failed:", err)
      await db.knowledgeDocument
        .update({ where: { id: doc.id }, data: { status: "FAILED" } })
        .catch(() => null)
    }
  )

  return NextResponse.json({ documentId: doc.id, status: "PROCESSING" }, { status: 202 })
}

async function triggerEmbed(payload: {
  tenantId:   string
  documentId: string
  text:       string
  name:       string
}) {
  const res = await fetch(`${env.INFERENCE_SERVICE_URL}/api/knowledge/embed`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${env.INFERENCE_API_SECRET}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Embed endpoint returned ${res.status}: ${body}`)
  }
}
