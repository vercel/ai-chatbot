import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
	const json = await req.json().catch(() => null);
	if (!json?.name) {
		return NextResponse.json(
			{ ok: false, error: "invalid_event" },
			{ status: 400 },
		);
	}

	// Aqui só confirma recebimento. Para produção, envie para seu sistema de observabilidade.
	console.log("Analytics event received:", json);
	return NextResponse.json({ ok: true });
}
