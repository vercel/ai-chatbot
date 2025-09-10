import { NextRequest, NextResponse } from "next/server"
import { compose } from "@/lib/services/template-composer"

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!["whatsapp","telegram","email","sms"].includes(body.channel)) {
    return NextResponse.json({ error: "invalid channel" }, { status: 400 })
  }
  try {
    const res = compose({ ...body, variables: body.variables ?? {} })
    return NextResponse.json({ channel: res.channel, compliance: res.compliance }, { status: res.compliance.status === "pass" ? 200 : 422 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "validate error" }, { status: 400 })
  }
}
