import type {
	AgentCapability,
	AgentExecutionContext,
	AgentMemory,
	AgentResponse,
	AgentState,
} from "../tools/types";

interface Proposal {
	title: string;
	highlights: string[];
	doc_url: string;
}

/**
 * Recommendation Agent
 * Generates final proposal and follow-up actions
 * Implements MEGA PROMPT #5 specification
 */
export class RecommendationAgent {
	private readonly capabilities: AgentCapability[] = [
		{
			name: "proposal_generation",
			description: "Geração de proposta final e follow-up",
			tools: [
				"blob_put",
				"shortlink_create",
				"crm_upsert",
				"schedule_create",
				"send_message",
				"webhook_publish",
			],
			triggers: ["proposta", "recomendação", "follow-up", "fechar"],
			priority: 6,
			contextWindow: 2000,
			maxIterations: 3,
		},
	];

	private memory: AgentMemory[] = [];

	private readonly state: AgentState = {
		id: "recommendation-agent",
		name: "Recommendation Agent",
		capabilities: this.capabilities,
		activeTools: [
			"blob_put",
			"shortlink_create",
			"crm_upsert",
			"schedule_create",
			"send_message",
			"webhook_publish",
		],
		context: {},
		memory: this.memory,
		status: "idle",
		lastActivity: new Date(),
	};

	async processRequest(context: AgentExecutionContext): Promise<AgentResponse> {
		const startTime = Date.now();
		this.state.status = "active";
		this.state.lastActivity = new Date();

		try {
			const userInput = this.extractUserInput(context);
			const proposal = this.buildProposal(userInput);
			const actions = this.buildActions();
			const reply = this.buildReply(proposal);

			const responseData = {
				stage: "recommendation" as const,
				proposal,
				actions,
				reply,
				next_steps: ["Agendar call", "Visita técnica"],
			};

			this.updateMemory(
				"conversation",
				{ input: userInput, response: responseData },
				["recommendation"],
			);

			this.state.status = "idle";
			return {
				agentId: this.state.id,
				response: { type: "recommendation", data: responseData },
				confidence: 0.88,
				executionTime: Date.now() - startTime,
			};
		} catch (error) {
			this.state.status = "error";
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.updateMemory("error", { error: errorMessage, context }, [
				"error",
				"recommendation",
			]);
			return {
				agentId: this.state.id,
				response: { type: "text", content: "Erro na geração da proposta." },
				confidence: 0.1,
				executionTime: Date.now() - startTime,
			};
		}
	}

	private extractUserInput(context: AgentExecutionContext): string {
		const lastMessage =
			context.conversationHistory[context.conversationHistory.length - 1];
		return lastMessage?.content || "";
	}

	private buildProposal(input: string): Proposal {
		const kwpMatch = input.match(/(\d+)\s*kwp/i);
		const kwhMatch = input.match(/(\d+)\s*kwh\/ano/i);
		const paybackMatch = input.match(/payback\s*(\d+)[-–](\d+)/i);

		const kwp = kwpMatch ? Number(kwpMatch[1]) : 0;
		const kwhYear = kwhMatch ? Number(kwhMatch[1]) : 0;
		const paybackMin = paybackMatch ? Number(paybackMatch[1]) : 0;
		const paybackMax = paybackMatch ? Number(paybackMatch[2]) : 0;

		return {
			title: `Sistema FV — ${kwp} kWp`,
			highlights: [
				`Geração ~${kwhYear} kWh/ano`,
				`Payback ${paybackMin}–${paybackMax} anos`,
			],
			doc_url: "https://short.link/proposta123",
		};
	}

	private buildActions() {
		return [
			{
				tool: "blob_put",
				args: {
					path: "propostas/LEAD1234.pdf",
					data: "<base64PDF>",
					mime: "application/pdf",
				},
				why: "gerar proposta",
			},
			{
				tool: "send_message",
				args: {
					channel: "whatsapp",
					to: "+5511999999999",
					text: "Enviei sua proposta: https://short.link/proposta123",
				},
				why: "entrega rápida",
			},
		];
	}

	private buildReply(proposal: Proposal): string {
		return `Enviei a proposta ${proposal.title}. Confirme o recebimento e podemos agendar a visita técnica.`;
	}

	private updateMemory(
		type: AgentMemory["type"],
		content: any,
		tags: string[],
	): void {
		const memory: AgentMemory = {
			id: `mem_${Date.now()}_${Math.random()}`,
			type,
			content,
			timestamp: new Date(),
			importance: type === "error" ? 8 : 5,
			tags,
		};
		this.memory.push(memory);
		if (this.memory.length > 50) this.memory = this.memory.slice(-50);
		this.state.memory = this.memory;
	}

	getState(): AgentState {
		return { ...this.state };
	}

	getCapabilities(): AgentCapability[] {
		return [...this.capabilities];
	}
}

export const recommendationAgent = new RecommendationAgent();
