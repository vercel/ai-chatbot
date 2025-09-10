import { describe, it, expect } from "vitest";
import { recommendationAgent } from "./recommendation-agent";
import type { AgentExecutionContext } from "../tools/types";

describe("RecommendationAgent", () => {
	const ctx: AgentExecutionContext = {
		agentId: "test-agent",
		userId: "user1",
		sessionId: "session1",
		currentPhase: "recommendation",
		availableTools: [],
		conversationHistory: [
			{
				id: "msg1",
				role: "user",
				content:
					"Preciso da proposta para sistema de 12 kWp com geração 18000 kWh/ano e payback 4-6 anos",
				timestamp: new Date(),
			},
		],
		metadata: {},
	};

	it("gera proposta final", async () => {
		const res = await recommendationAgent.processRequest(ctx);
		const data = res.response.data as any;
		expect(res.response.type).toBe("recommendation");
		expect(data.proposal.title).toContain("12 kWp");
		expect(data.actions.length).toBeGreaterThan(0);
	});
});
