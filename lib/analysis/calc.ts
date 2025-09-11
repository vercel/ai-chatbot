import type { EnergyInput, ViabilityResult } from "./types";

/**
 * Heurísticas de cálculo de viabilidade (fallback quando tools falham)
 */

// Constantes de fallback
export const FALLBACK_CONSTANTS = {
	PR: 0.75, // Performance Ratio
	IRRADIANCE_KWH_KWP_DAY: 4.5, // Irradiação média Brasil
	CAPEX_PER_KWP_OWNER: 4500, // R$/kWp para consumidor final
	CAPEX_PER_KWP_INTEGRATOR: 4200, // R$/kWp para integrador
	INFLATION_TARIFF: 0.05, // Inflação anual da tarifa
} as const;

/**
 * Calcula kWh por kWp por mês usando irradiação
 */
export function calculateKwhPerKwpMonth(
	irradianceKwhKwpDay: number = FALLBACK_CONSTANTS.IRRADIANCE_KWH_KWP_DAY,
	pr: number = FALLBACK_CONSTANTS.PR,
): number {
	return irradianceKwhKwpDay * 30 * pr;
}

/**
 * Estima offset alvo baseado no consumo médio
 * Retorna valor entre 0.4 e 1.0
 */
export function estimateOffsetTarget(avgKwhMonth: number): number {
	// Estimativa grosseira baseada em faixas de consumo
	if (avgKwhMonth < 200) return 0.4; // Pequeno consumo
	if (avgKwhMonth < 500) return 0.6; // Consumo médio
	if (avgKwhMonth < 1000) return 0.8; // Consumo alto
	return 1.0; // Consumo muito alto
}

/**
 * Calcula kWp estimado baseado no consumo e offset
 */
export function calculateEstimatedKwp(
	avgKwhMonth: number,
	kwhPerKwpMonth: number,
	offsetTarget: number,
): number {
	return (avgKwhMonth * offsetTarget) / kwhPerKwpMonth;
}

/**
 * Calcula CAPEX baseado no kWp estimado e persona
 */
export function calculateCapex(
	estimatedKwp: number,
	persona: "owner" | "integrator",
): number {
	const capexPerKwp =
		persona === "owner"
			? FALLBACK_CONSTANTS.CAPEX_PER_KWP_OWNER
			: FALLBACK_CONSTANTS.CAPEX_PER_KWP_INTEGRATOR;

	return estimatedKwp * capexPerKwp;
}

/**
 * Calcula conta atual mensal
 */
export function calculateBillNow(
	avgKwhMonth: number,
	tariffRsKwh: number,
): number {
	return avgKwhMonth * tariffRsKwh;
}

/**
 * Calcula geração mensal estimada
 */
export function calculateGenMonth(
	estimatedKwp: number,
	kwhPerKwpMonth: number,
): number {
	return estimatedKwp * kwhPerKwpMonth;
}

/**
 * Calcula economia mensal (não pode exceder a conta atual)
 */
export function calculateSavingsMonth(
	billNow: number,
	genMonth: number,
	tariffRsKwh: number,
): number {
	const potentialSavings = genMonth * tariffRsKwh;
	return Math.min(billNow, potentialSavings);
}

/**
 * Calcula payback em anos
 */
export function calculatePaybackYears(
	capex: number,
	savingsMonth: number,
): number {
	if (savingsMonth <= 0) return Number.POSITIVE_INFINITY;
	return capex / (savingsMonth * 12);
}

/**
 * Calcula ROI para N anos
 */
export function calculateRoiNYears(
	capex: number,
	savingsMonth: number,
	years: number,
	inflationTariff: number = FALLBACK_CONSTANTS.INFLATION_TARIFF,
): number {
	if (capex <= 0) return 0;

	let totalSavings = 0;
	let currentSavings = savingsMonth;

	for (let year = 1; year <= years; year++) {
		totalSavings += currentSavings * 12;
		currentSavings *= 1 + inflationTariff;
	}

	return (totalSavings - capex) / capex;
}

/**
 * Calcula média anual de uma série de 12 meses
 */
export function calculateAnnualAverage(series12m: number[]): number {
	if (series12m.length !== 12) {
		throw new Error("Série deve ter exatamente 12 meses");
	}
	return series12m.reduce((sum, value) => sum + value, 0) / 12;
}

/**
 * Função principal de cálculo de viabilidade (fallback completo)
 */
export function calculateViabilityFallback(
	input: EnergyInput,
): Omit<ViabilityResult, "stage"> {
	// Determinar consumo médio
	const avgKwhMonth = input.series_12m
		? calculateAnnualAverage(input.series_12m)
		: (input.avg_kwh_month ?? 0);

	// Usar tarifa fornecida ou fallback
	const tariffRsKwh = input.tariff_rs_kwh || 0.8; // Fallback médio Brasil

	// Calcular parâmetros base
	const kwhPerKwpMonth = calculateKwhPerKwpMonth();
	const offsetTarget = estimateOffsetTarget(avgKwhMonth);
	const estimatedKwp = calculateEstimatedKwp(
		avgKwhMonth,
		kwhPerKwpMonth,
		offsetTarget,
	);
	const capex = calculateCapex(estimatedKwp, input.persona);

	// Calcular economia
	const billNow = calculateBillNow(avgKwhMonth, tariffRsKwh);
	const genMonth = calculateGenMonth(estimatedKwp, kwhPerKwpMonth);
	const savingsMonth = calculateSavingsMonth(billNow, genMonth, tariffRsKwh);

	// Calcular métricas financeiras
	const paybackYears = calculatePaybackYears(capex, savingsMonth);
	const roi5y = calculateRoiNYears(capex, savingsMonth, 5);
	const roi10y = calculateRoiNYears(capex, savingsMonth, 10);

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
		inputs: {
			persona: input.persona,
			utility: input.utility,
			uf: input.uf,
			avg_kwh_month: avgKwhMonth,
			tariff_rs_kwh: tariffRsKwh,
		},
		assumptions: {
			PR: FALLBACK_CONSTANTS.PR,
			kwh_per_kwp_month: kwhPerKwpMonth,
			capex_per_kwp:
				input.persona === "owner"
					? FALLBACK_CONSTANTS.CAPEX_PER_KWP_OWNER
					: FALLBACK_CONSTANTS.CAPEX_PER_KWP_INTEGRATOR,
			inflation_tariff: FALLBACK_CONSTANTS.INFLATION_TARIFF,
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
}
