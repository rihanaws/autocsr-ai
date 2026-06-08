import { NextRequest, NextResponse } from 'next/server'

// TODO Week 5: remove IP from Tenant authorized_ips in DB

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ip: string }> },
) {
  const { ip } = await params
  return NextResponse.json({ deleted: true, ip })
}
