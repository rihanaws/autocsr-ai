import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { NextResponse } from "next/server";

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

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const payload = {
    query: body.query.trim(),
    tenant_id: session.user.tenantId,
    session_id: body.session_id ?? null,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let inferRes: Response;
  try {
    inferRes = await fetch(`${env.INFERENCE_SERVICE_URL}/api/infer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.INFERENCE_API_SECRET}`,
        "X-Client-IP": clientIp,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Inference service timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Inference service unavailable" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
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
