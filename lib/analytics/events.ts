import { track } from "@vercel/analytics/server";

export interface AppOpenPayload {
	device_id: string;
	source: string;
	timestamp: string;
}

export interface SignupCompletePayload {
	user_id: string;
	method: string;
	timestamp: string;
}

export interface FeatureViewPayload {
	user_id: string;
	feature_id: string;
	timestamp: string;
}

export interface ActivationSuccessPayload {
	user_id: string;
	feature_id: string;
	timestamp: string;
}

export interface PurchaseConfirmedPayload {
	user_id: string;
	plan_type: string;
	value: number;
	timestamp: string;
}

export interface SupportTicketPayload {
	user_id: string;
	category: string;
	resolved: boolean;
}

export type AnalyticsEventPayloads = {
	app_open: AppOpenPayload;
	signup_complete: SignupCompletePayload;
	feature_view: FeatureViewPayload;
	activation_success: ActivationSuccessPayload;
	purchase_confirmed: PurchaseConfirmedPayload;
	support_ticket: SupportTicketPayload;
};

export type AnalyticsEventName = keyof AnalyticsEventPayloads;

export async function trackEvent<E extends AnalyticsEventName>(
	name: E,
	payload: AnalyticsEventPayloads[E],
) {
	await track(name, payload);
}
