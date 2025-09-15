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

export type EventName =
        | "app_open"
        | "journey_phase_view"
        | "journey_cta_click"
        | "upload_bill_submitted"
        | "analysis_ready_view"
        | "persona_switch"
        | "guest_limit_banner_view"
        | "guest_upgrade_click";

export function trackEvent(name: EventName, data: Record<string, unknown> = {}): void {
        try {
                (globalThis as any).__analytics?.track?.(name, data);
        } catch {
                // no-op
        }

        try {
                fetch(ENDPOINT, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                                name,
                                ...data,
                                ts: data.ts ?? Date.now(),
                                ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                        }),
                }).catch(() => {});
        } catch {
                // no-op
        }
}
