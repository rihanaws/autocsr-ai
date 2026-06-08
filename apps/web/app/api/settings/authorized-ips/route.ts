import { NextRequest, NextResponse } from 'next/server'

// TODO Week 5: persist authorized IPs to Tenant row in DB

export async function GET() {
  return NextResponse.json([])
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { ip: unknown }
  if (typeof body.ip !== 'string' || !body.ip.trim()) {
    return NextResponse.json({ error: 'ip required' }, { status: 400 })
  }
  return NextResponse.json({ ip: body.ip.trim(), added: new Date().toISOString() })
}
