import { test, expect } from "@playwright/test";

test.describe("Dimensioning Flow", () => {
  test("owner persona dimensioning", async ({ page }) => {
    await page.goto("/journey/dimensioning");

    // Fill area
    await page.fill('input[name="roof.total_area_m2"]', "100");

    // Submit
    await page.click('button[type="submit"]');

    // Wait for results
    await page.waitForSelector("text=Resultado do Dimensionamento");

    // Check KPIs
    await expect(page.locator("text=kWp")).toBeVisible();
    await expect(page.locator("text=kW")).toBeVisible();
  });

  test("integrator persona with sections", async ({ page }) => {
    await page.goto("/journey/dimensioning");

    // Add section
    await page.click("text=+ Adicionar Seção");

    // Fill section
    await page.fill('input[placeholder="Comprimento (m)"]', "10");
    await page.fill('input[placeholder="Largura (m)"]', "5");

    // Submit
    await page.click('button[type="submit"]');

    // Check results
    await expect(page.locator("text=Layout por Seção")).toBeVisible();
    await expect(page.locator("text=Exportar BOM")).toBeVisible();
  });
});