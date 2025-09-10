import { describe, expect, test } from "vitest";
import {
	OmnichannelService,
	CampaignPlan,
} from "../lib/services/omnichannel-service";

describe("OmnichannelService", () => {
	test("runCampaign executes actions sequentially", async () => {
		const plan: CampaignPlan = {
			campaign: {
				name: "test",
				objective: "leadgen",
				audience_size: 1,
				persona_mode: "mixed",
				schedule_window: {
					start_iso: "2025-01-01T00:00:00",
					end_iso: "2025-01-01T00:00:00",
					timezone: "America/Sao_Paulo",
				},
			},
			content: {
				variant_A: { headline: "", body: "hi", cta: "" },
				variant_B: { headline: "", body: "hi", cta: "" },
			},
			channels: [],
			actions: [
				{ tool: "compliance_check", args: { payload: "test" }, why: "ensure" },
				{
					tool: "send_email",
					args: {
						to: "user@example.com",
						subject: "Hello",
						html: "<p>Hello</p>",
					},
					why: "notify",
				},
			],
			kpis: { deliverability_target: 0, ctr_target: 0, reply_rate_target: 0 },
			reply: "",
		};

		const service = new OmnichannelService();
		const result = await service.runCampaign(plan);
		expect(result).toHaveLength(2);
	});
});
