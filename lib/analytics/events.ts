export function emitTemplateRequested(p: Record<string, unknown>) {
	console.log(JSON.stringify({ evt: "template_requested", ...p }));
}
export function emitTemplateRendered(p: Record<string, unknown>) {
	console.log(JSON.stringify({ evt: "template_rendered", ...p }));
}
export function emitComplianceFailed(p: Record<string, unknown>) {
	console.log(JSON.stringify({ evt: "compliance_failed", ...p }));
}

const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_API || "/api/analytics";

/**
 * Edge-safe tracker: usa fetch; evita Node-only APIs (fs, path, process.env secretos, etc.)
 * Pode ser chamado no middleware. Em falha, vira no-op.
 */
export async function trackEvent(
	eventName: string,
	data: Record<string, unknown>,
): Promise<void> {
	try {
		// No middleware, nunca bloqueie a resposta: fire-and-forget
		fetch(ENDPOINT, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				name: eventName,
				...data,
				ts: Date.now(),
				ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
			}),
			// Em Edge, não use keepalive true universalmente; mantém padrão.
		}).catch(() => {});
	} catch {
		// no-op
	}
}
