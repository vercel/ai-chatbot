import type {
	AgentCapability,
	AgentExecutionContext,
	AgentMemory,
	AgentResponse,
	AgentState,
} from "../tools/types";

interface DimensioningInputs {
	consumption_kwh_month: number | null;
	roof_m2: number | null;
	lat: number | null;
	lng: number | null;
	tilt: number | null;
	azimuth: number | null;
}

interface DimensioningResult {
	estimated_kwp: number | null;
	expected_gen_kwh_year: number | null;
	area_used_m2: number | null;
	assumptions: string[];
}

interface EconomicsResult {
	capex_range_brl: { min: number | null; max: number | null };
	payback_years_range: { min: number | null; max: number | null };
	tariff_ref: { utility: string | null; uf: string | null };
}

/**
 * Analysis & Dimensioning Agent
 * Converts consumption and roof area into sizing and economic estimates
 * Implements MEGA PROMPT #4 specification
 */
export class AnalysisDimensioningAgent {
	private readonly capabilities: AgentCapability[] = [
		{
			name: "analysis_dimensioning",
			description:
				"Dimensionamento e análise econômica de sistemas fotovoltaicos",
			tools: [
				"pv_irradiance_lookup",
				"tariff_lookup",
				"pv_dimensioning_calc",
				"finance_calc",
				"bom_build",
				"sql_upsert",
			],
			triggers: ["dimensionamento", "análise", "kwp", "payback", "capex"],
			priority: 7,
			contextWindow: 3000,
			maxIterations: 3,
		},
	];

	private memory: AgentMemory[] = [];
	private inputs: DimensioningInputs = {
		consumption_kwh_month: null,
		roof_m2: null,
		lat: null,
		lng: null,
		tilt: null,
		azimuth: null,
	};

	private readonly state: AgentState = {
		id: "analysis-dimensioning-agent",
		name: "Analysis & Dimensioning Agent",
		capabilities: this.capabilities,
		activeTools: [
			"pv_irradiance_lookup",
			"tariff_lookup",
			"pv_dimensioning_calc",
			"finance_calc",
			"bom_build",
			"sql_upsert",
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
			this.parseInput(userInput);

			const dimensioning = this.calculateDimensioning();
			const economics = this.calculateEconomics(dimensioning);
			const bom = this.buildBom(dimensioning.estimated_kwp);

			const actions = this.buildActions();
			const reply = this.buildReply(dimensioning, economics);

			const responseData = {
				stage: "analysis_dimensioning",
				dimensioning,
				economics,
				bom,
				actions,
				reply,
			};

			this.updateMemory(
				"conversation",
				{ input: userInput, response: responseData },
				["analysis", "dimensioning"],
			);

			this.state.status = "idle";
			return {
				agentId: this.state.id,
				response: { type: "analysis_dimensioning", data: responseData },
				confidence: 0.85,
				executionTime: Date.now() - startTime,
			};
		} catch (error) {
			this.state.status = "error";
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.updateMemory("error", { error: errorMessage, context }, [
				"error",
				"analysis",
			]);
			return {
				agentId: this.state.id,
				response: { type: "text", content: "Erro no dimensionamento." },
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

	private parseInput(input: string): void {
		const lower = input.toLowerCase();

		const consumptionMatch = lower.match(/(\d+)[\s-]*kwh/);
		if (consumptionMatch)
			this.inputs.consumption_kwh_month = parseFloat(consumptionMatch[1]);

		const areaMatch = lower.match(/(\d+)[\s-]*(?:m2|m²|metros)/);
		if (areaMatch) this.inputs.roof_m2 = parseFloat(areaMatch[1]);

		const latMatch = lower.match(/lat(?:itude)?[:\s]*(-?[\d.]+)/);
		if (latMatch) this.inputs.lat = parseFloat(latMatch[1]);

		const lngMatch = lower.match(/lng|long(?:itude)?[:\s]*(-?[\d.]+)/);
		if (lngMatch) this.inputs.lng = parseFloat(lngMatch[1]);

		const tiltMatch = lower.match(/tilt[:\s]*([\d.]+)/);
		if (tiltMatch) this.inputs.tilt = parseFloat(tiltMatch[1]);

		const azimuthMatch = lower.match(/azim(?:uth)?[:\s]*([\d.]+)/);
		if (azimuthMatch) this.inputs.azimuth = parseFloat(azimuthMatch[1]);
	}

	private calculateDimensioning(): DimensioningResult {
		const assumptions: string[] = [];

		const tilt = this.inputs.tilt ?? 15;
		if (this.inputs.tilt === null) assumptions.push("tilt=15° (padrão)");

		const azimuth = this.inputs.azimuth ?? 0;
		if (this.inputs.azimuth === null) assumptions.push("azimuth=0° (norte)");

		const irradiance = 5; // kWh/m2/day default
		if (this.inputs.lat === null || this.inputs.lng === null) {
			assumptions.push("irradiância padrão 5 kWh/m²/dia");
		}

		const consumption = this.inputs.consumption_kwh_month;
		if (!consumption) {
			assumptions.push("Falta consumo mensal");
			return {
				estimated_kwp: null,
				expected_gen_kwh_year: null,
				area_used_m2: null,
				assumptions,
			};
		}

		const pr = 0.75;
		const kwp = consumption / (irradiance * 30 * pr);
		const area = kwp * 5;
		const generationYear = kwp * irradiance * 365 * pr;

		return {
			estimated_kwp: Number(kwp.toFixed(2)),
			expected_gen_kwh_year: Number(generationYear.toFixed(0)),
			area_used_m2: Number(area.toFixed(1)),
			assumptions,
		};
	}

	private calculateEconomics(dim: DimensioningResult): EconomicsResult {
		const capexRange = {
			min: null as number | null,
			max: null as number | null,
		};
		const paybackRange = {
			min: null as number | null,
			max: null as number | null,
		};
		const tariffRef = {
			utility: null as string | null,
			uf: null as string | null,
		};

		if (dim.estimated_kwp) {
			capexRange.min = Number((dim.estimated_kwp * 4500).toFixed(0));
			capexRange.max = Number((dim.estimated_kwp * 5500).toFixed(0));
		}

		const tariff = 0.75; // R$/kWh
		const generation = dim.expected_gen_kwh_year ?? 0;
		if (generation > 0 && capexRange.min && capexRange.max) {
			paybackRange.min = Number(
				(capexRange.min / (tariff * generation)).toFixed(1),
			);
			paybackRange.max = Number(
				(capexRange.max / (tariff * generation)).toFixed(1),
			);
		}

		return {
			capex_range_brl: capexRange,
			payback_years_range: paybackRange,
			tariff_ref: tariffRef,
		};
	}

	private buildBom(kwp: number | null) {
		if (!kwp) return [];
		const modules = Math.ceil((kwp * 1000) / 550);
		const inverters = Math.ceil(kwp / 5);
		return [
			{ item: "Módulo 550W", qty: modules },
			{ item: "Inversor 5kW", qty: inverters },
		];
	}

	private buildActions() {
		const actions: any[] = [];
		if (this.inputs.lat !== null && this.inputs.lng !== null) {
			actions.push({
				tool: "pv_irradiance_lookup",
				args: { lat: this.inputs.lat, lng: this.inputs.lng },
				why: "base energética",
			});
		}
		if (this.inputs.consumption_kwh_month && this.inputs.roof_m2) {
			actions.push({
				tool: "pv_dimensioning_calc",
				args: {
					consumption_kwh_month: this.inputs.consumption_kwh_month,
					roof_m2: this.inputs.roof_m2,
					tilt: this.inputs.tilt ?? 15,
					azimuth: this.inputs.azimuth ?? 0,
				},
				why: "kWp ideal",
			});
		}
		actions.push({
			tool: "finance_calc",
			args: {},
			why: "ROI/pagamento",
		});
		return actions;
	}

	private buildReply(dim: DimensioningResult, eco: EconomicsResult): string {
		if (!dim.estimated_kwp) {
			return "Faltam informações essenciais para o dimensionamento (consumo mensal).";
		}
		return `Sistema estimado de ${dim.estimated_kwp} kWp gerando ~${dim.expected_gen_kwh_year} kWh/ano. Payback entre ${eco.payback_years_range.min} e ${eco.payback_years_range.max} anos.`;
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

export const analysisDimensioningAgent = new AnalysisDimensioningAgent();
