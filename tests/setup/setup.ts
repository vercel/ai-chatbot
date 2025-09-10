import { test as setup } from "@playwright/test";

/**
 * Configuração Global de Setup para Testes 360°
 *
 * Este arquivo configura o estado inicial necessário para todos os testes 360°,
 * incluindo autenticação, dados de teste e configurações globais.
 */

interface TestData {
	locations: Array<{
		name: string;
		lat: number;
		lng: number;
	}>;
	solarData: {
		tilt: number;
		azimuth: number;
		systemSize: number;
		efficiency: number;
	};
	weatherData: {
		temperature: number;
		humidity: number;
		cloudCover: number;
		windSpeed: number;
	};
}

declare global {
	interface Window {
		testData?: TestData;
	}
}

setup.describe("Global Setup - 360° Tests", () => {
	setup("configurar ambiente de teste", async ({ page }) => {
		// Configurar viewport padrão
		await page.setViewportSize({ width: 1280, height: 720 });

		// Configurar geolocalização para São Paulo (Brasil)
		await page.context().grantPermissions(["geolocation"]);
		await page.context().setGeolocation({
			latitude: -23.5505,
			longitude: -46.6333,
		});

		// Configurar locale e timezone
		await page.context().addInitScript(() => {
			Object.defineProperty(navigator, "language", {
				value: "pt-BR",
			});
			Object.defineProperty(navigator, "languages", {
				value: ["pt-BR", "pt", "en"],
			});
		});

		// Limpar localStorage e sessionStorage
		await page.context().addInitScript(() => {
			localStorage.clear();
			sessionStorage.clear();
		});

		// Configurar dados de teste no localStorage
		await page.context().addInitScript(() => {
			localStorage.setItem("test-mode", "360-degree");
			localStorage.setItem("environment", "test");
			localStorage.setItem("timestamp", new Date().toISOString());
		});

		console.log("✅ Ambiente de teste 360° configurado com sucesso");
	});

	setup("verificar conectividade de APIs", async ({ page }) => {
		// Verificar se as APIs externas estão acessíveis
		const apiChecks = [
			{ name: "Google Maps API", url: "https://maps.googleapis.com" },
			{ name: "Weather API", url: "https://api.openweathermap.org" },
			{ name: "Solar API", url: "https://api.solcast.com.au" },
		];

		for (const api of apiChecks) {
			try {
				const response = await page.request.get(api.url, { timeout: 5000 });
				if (response.ok()) {
					console.log(`✅ ${api.name} está acessível`);
				} else {
					console.log(`⚠️ ${api.name} retornou status ${response.status()}`);
				}
			} catch (error) {
				console.log(
					`⚠️ ${api.name} não está acessível: ${(error as Error).message}`,
				);
			}
		}
	});

	setup("configurar dados de teste", async ({ page }) => {
		// Criar dados de teste para cenários 360°
		const testData = {
			locations: [
				{ name: "São Paulo", lat: -23.5505, lng: -46.6333 },
				{ name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
				{ name: "Belo Horizonte", lat: -19.9191, lng: -43.9386 },
			],
			solarData: {
				tilt: 30,
				azimuth: 180,
				systemSize: 5.0,
				efficiency: 0.85,
			},
			weatherData: {
				temperature: 25,
				humidity: 60,
				cloudCover: 20,
				windSpeed: 3.5,
			},
		};

		await page.context().addInitScript((data) => {
			window.testData = data;
		}, testData);

		console.log("✅ Dados de teste 360° configurados");
	});

	setup("configurar mocks de API", async ({ page }) => {
		// Configurar mocks para APIs externas
		await page.route("**/maps.googleapis.com/**", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					results: [
						{
							formatted_address: "São Paulo, SP, Brasil",
							geometry: {
								location: { lat: -23.5505, lng: -46.6333 },
							},
						},
					],
				}),
			});
		});

		await page.route("**/api.openweathermap.org/**", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					main: { temp: 25, humidity: 60 },
					clouds: { all: 20 },
					wind: { speed: 3.5 },
				}),
			});
		});

		console.log("✅ Mocks de API configurados para testes 360°");
	});
});
