import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const INFERENCE_URL = process.env.INFERENCE_SERVICE_URL ?? "http://localhost:8000";
const INFERENCE_SECRET = process.env.INFERENCE_API_SECRET ?? "";

interface InferRequest {
  query: string;
  session_id?: string;
}

interface InferResponse {
  response: string;
  agent_type: string;
  cache_hit: boolean;
  confidence: number;
  resolution_ms: number;
  flagged: boolean;
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: InferRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const payload = {
    query: body.query.trim(),
    tenant_id: session.user.tenantId,
    session_id: body.session_id ?? null,
  };

  let inferRes: Response;
  try {
    inferRes = await fetch(`${INFERENCE_URL}/api/infer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INFERENCE_SECRET ? { "x-api-secret": INFERENCE_SECRET } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json({ error: "Inference service unavailable" }, { status: 503 });
  }

  if (!inferRes.ok) {
    const text = await inferRes.text().catch(() => "");
    return NextResponse.json(
      { error: "Inference error", detail: text },
      { status: inferRes.status }
    );
  }

  const data: InferResponse = await inferRes.json();
  return NextResponse.json(data);
}
