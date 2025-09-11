import { z } from "zod";

export const UFSchema = z.enum([
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
]);

export const EnergyInputSchema = z
	.object({
		persona: z.enum(["owner", "integrator"]).default("owner"),
		utility: z.string().min(2).optional(),
		uf: UFSchema.optional(),
		avg_kwh_month: z.number().positive().optional(),
		series_12m: z.array(z.number().min(0)).length(12).optional(),
		tariff_rs_kwh: z.number().min(0.2).max(5).optional(),
		attachments: z
			.array(
				z.object({
					name: z.string(),
					type: z.string(),
					size: z.number().int().nonnegative(),
				}),
			)
			.optional(),
	})
	.refine((d) => !!d.avg_kwh_month || !!d.series_12m, {
		message: "Informe média mensal ou série 12 meses.",
	});

export type EnergyInput = z.infer<typeof EnergyInputSchema>;

export const ViabilityResultSchema = z.object({
	stage: z.literal("analysis"),
	inputs: z.object({
		persona: z.string(),
		utility: z.string().optional(),
		uf: z.string().optional(),
		avg_kwh_month: z.number(),
		tariff_rs_kwh: z.number(),
	}),
	assumptions: z.object({
		PR: z.number(),
		kwh_per_kwp_month: z.number(),
		capex_per_kwp: z.number(),
		inflation_tariff: z.number().optional(),
	}),
	estimates: z.object({
		estimated_kwp: z.number(),
		gen_month: z.number(),
		bill_now: z.number(),
		savings_month: z.number(),
		capex: z.number(),
		payback_years: z.number(),
		roi_5y: z.number(),
		roi_10y: z.number(),
	}),
	summary: z.object({
		headline: z.string(),
		bullets: z.array(z.string()),
	}),
});

export type ViabilityResult = z.infer<typeof ViabilityResultSchema>;

// Tool interfaces (abstratas)
export interface TariffLookupParams {
	utility: string;
	uf: string;
}

export interface TariffLookupResult {
	tariff_rs_kwh: number;
	last_updated: string;
}

export interface PVIrradianceLookupParams {
	lat: number;
	lng: number;
}

export interface PVIrradianceLookupResult {
	kwh_kwp_day: number;
	source: string;
}

export interface FinanceCalcParams {
	capex: number;
	savings_month: number;
	inflation_tariff?: number;
	years: number;
}

export interface FinanceCalcResult {
	payback_years: number;
	roi_ny: number;
	npv: number;
}
