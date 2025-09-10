import { NextRequest, NextResponse } from "next/server"
import { getPersona } from "@/lib/repo/personas-repo"
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const p = getPersona(params.id)
  return p ? NextResponse.json(p) : NextResponse.json({ error: "not found" }, { status: 404 })
}
