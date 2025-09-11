import type {
	EnergyInput,
	ViabilityResult,
	TariffLookupParams,
	TariffLookupResult,
	PVIrradianceLookupParams,
	PVIrradianceLookupResult,
	FinanceCalcParams,
	FinanceCalcResult,
} from "./types";
import { calculateViabilityFallback } from "./calc";

/**
 * Serviço de análise de viabilidade
 * Orquestra chamadas para tools externas com fallbacks
 */

// Mock implementations das tools (substituir por chamadas reais)
async function tariffLookup(
	params: TariffLookupParams,
): Promise<TariffLookupResult | null> {
	try {
		// Simulação de chamada para API externa
		// const response = await fetch(`${process.env.ANALYSIS_API_URL}/tariff`, {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(params),
		// });

		// Mock response
		const mockTariffs: Record<string, number> = {
			SP: 0.85,
			RJ: 0.82,
			MG: 0.78,
			RS: 0.75,
			PR: 0.76,
		};

		const tariff = mockTariffs[params.uf] || 0.8;

		return {
			tariff_rs_kwh: tariff,
			last_updated: new Date().toISOString(),
		};
	} catch (error) {
		console.warn("Tariff lookup failed:", error);
		return null;
	}
}

async function pvIrradianceLookup(
	params: PVIrradianceLookupParams,
): Promise<PVIrradianceLookupResult | null> {
	try {
		// Simulação de chamada para API externa
		// const response = await fetch(`${process.env.ANALYSIS_API_URL}/irradiance`, {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(params),
		// });

		// Mock response baseado na localização aproximada
		const irradiance = 4.5; // Média Brasil

		return {
			kwh_kwp_day: irradiance,
			source: "fallback",
		};
	} catch (error) {
		console.warn("PV irradiance lookup failed:", error);
		return null;
	}
}

async function financeCalc(
	params: FinanceCalcParams,
): Promise<FinanceCalcResult | null> {
	try {
		// Simulação de chamada para API externa
		// const response = await fetch(`${process.env.ANALYSIS_API_URL}/finance`, {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(params),
		// });

		// Cálculo simples de payback
		const paybackYears = params.capex / (params.savings_month * 12);

		// Cálculo simples de ROI
		const totalSavings = params.savings_month * 12 * params.years;
		const roi = (totalSavings - params.capex) / params.capex;

		// NPV simples (sem desconto)
		const npv = totalSavings - params.capex;

		return {
			payback_years: paybackYears,
			roi_ny: roi,
			npv: npv,
		};
	} catch (error) {
		console.warn("Finance calc failed:", error);
		return null;
	}
}

/**
 * Busca tarifa usando tool ou fallback
 */
async function getTariff(
	utility?: string,
	uf?: string,
	fallbackTariff?: number,
): Promise<number> {
	if (!utility || !uf) {
		return fallbackTariff || 0.8;
	}

	const tariffResult = await tariffLookup({ utility, uf });
	return tariffResult?.tariff_rs_kwh || fallbackTariff || 0.8;
}

/**
 * Busca irradiação usando tool ou fallback
 */
async function getIrradiance(
	lat = -23.5505, // São Paulo como default
	lng = -46.6333,
): Promise<number> {
	const irradianceResult = await pvIrradianceLookup({ lat, lng });
	return irradianceResult?.kwh_kwp_day || 4.5;
}

/**
 * Calcula métricas financeiras usando tool ou fallback
 */
async function calculateFinancialMetrics(
	capex: number,
	savingsMonth: number,
	years = 5,
): Promise<{ payback_years: number; roi_ny: number }> {
	const financeResult = await financeCalc({
		capex,
		savings_month: savingsMonth,
		years,
	});

	if (financeResult) {
		return {
			payback_years: financeResult.payback_years,
			roi_ny: financeResult.roi_ny,
		};
	}

	// Fallback calculation
	const paybackYears = capex / (savingsMonth * 12);
	const totalSavings = savingsMonth * 12 * years;
	const roi = (totalSavings - capex) / capex;

	return {
		payback_years: paybackYears,
		roi_ny: roi,
	};
}

/**
 * Determina o target de offset baseado no consumo médio
 */
function getOffsetTarget(avgKwhMonth: number): number {
	if (avgKwhMonth < 200) return 0.4;
	if (avgKwhMonth < 500) return 0.6;
	if (avgKwhMonth < 1000) return 0.8;
	return 1.0;
}

/**
 * Função principal de análise de viabilidade
 * Tenta usar tools externas, cai para fallback se necessário
 */
export async function analyzeViability(
	input: EnergyInput,
): Promise<ViabilityResult> {
	try {
		// Determinar consumo médio
		const avgKwhMonth = input.series_12m
			? input.series_12m.reduce((sum, value) => sum + value, 0) / 12
			: (input.avg_kwh_month ?? 0);

		// Buscar tarifa (tool ou fallback)
		const tariffRsKwh =
			input.tariff_rs_kwh || (await getTariff(input.utility, input.uf));

		// Buscar irradiação (tool ou fallback)
		const irradiance = await getIrradiance();

		// Calcular parâmetros base usando tools
		const PR = 0.75;
		const kwhPerKwpMonth = irradiance * 30 * PR;
		const offsetTarget = getOffsetTarget(avgKwhMonth);
		const estimatedKwp = (avgKwhMonth * offsetTarget) / kwhPerKwpMonth;

		const capexPerKwp = input.persona === "owner" ? 4500 : 4200;
		const capex = estimatedKwp * capexPerKwp;

		// Calcular economia
		const billNow = avgKwhMonth * tariffRsKwh;
		const genMonth = estimatedKwp * kwhPerKwpMonth;
		const savingsMonth = Math.min(billNow, genMonth * tariffRsKwh);

		// Calcular métricas financeiras (tool ou fallback)
		const { payback_years: paybackYears } = await calculateFinancialMetrics(
			capex,
			savingsMonth,
			5,
		);
		const { roi_ny: roi5y } = await calculateFinancialMetrics(
			capex,
			savingsMonth,
			5,
		);
		const { roi_ny: roi10y } = await calculateFinancialMetrics(
			capex,
			savingsMonth,
			10,
		);

		// Gerar resumo
		const headline =
			input.persona === "owner"
				? `Viabilidade estimada: ${Math.round(estimatedKwp * 10) / 10} kWp`
				: "Análise técnica completa realizada";

		const bullets = [
			`Economia mensal estimada: R$ ${Math.round(savingsMonth).toLocaleString("pt-BR")}`,
			`Payback em aproximadamente ${Math.round(paybackYears * 10) / 10} anos`,
			`ROI de ${Math.round(roi5y * 100)}% em 5 anos`,
		];

		return {
			stage: "analysis",
			inputs: {
				persona: input.persona,
				utility: input.utility,
				uf: input.uf,
				avg_kwh_month: avgKwhMonth,
				tariff_rs_kwh: tariffRsKwh,
			},
			assumptions: {
				PR,
				kwh_per_kwp_month: kwhPerKwpMonth,
				capex_per_kwp: capexPerKwp,
				inflation_tariff: 0.05,
			},
			estimates: {
				estimated_kwp: estimatedKwp,
				gen_month: genMonth,
				bill_now: billNow,
				savings_month: savingsMonth,
				capex: capex,
				payback_years: paybackYears,
				roi_5y: roi5y,
				roi_10y: roi10y,
			},
			summary: {
				headline,
				bullets,
			},
		};
	} catch (error) {
		console.error("Analysis failed, using fallback:", error);

		// Fallback completo se tudo falhar
		const fallbackResult = calculateViabilityFallback(input);
		return {
			stage: "analysis",
			...fallbackResult,
		};
	}
}
