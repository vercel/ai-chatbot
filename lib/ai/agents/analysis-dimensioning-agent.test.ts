import { describe, it, expect } from "vitest";
import { analysisDimensioningAgent } from "./analysis-dimensioning-agent";
import type { AgentExecutionContext } from "../tools/types";

describe("AnalysisDimensioningAgent", () => {
	const ctx: AgentExecutionContext = {
		agentId: "test-agent",
		userId: "user1",
		sessionId: "session1",
		currentPhase: "analysis",
		availableTools: [],
		conversationHistory: [
			{
				id: "msg1",
				role: "user",
				content: "Tenho consumo de 500 kWh/mês e 60m2 de telhado",
				timestamp: new Date(),
			},
		],
		metadata: {},
	};

	it("calcula dimensionamento básico", async () => {
		const res = await analysisDimensioningAgent.processRequest(ctx);
		const data = res.response.data as any;
		expect(res.response.type).toBe("analysis_dimensioning");
		expect(data.dimensioning.estimated_kwp).not.toBeNull();
		expect(data.economics.capex_range_brl.min).not.toBeNull();
	});
});
