import { NextResponse } from "next/server"
import { listPersonas } from "@/lib/repo/personas-repo"
export async function GET() {
  return NextResponse.json({ personas: listPersonas() })
}
