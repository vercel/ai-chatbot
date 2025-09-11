import { test, expect } from "@playwright/test";

test.describe("Lead Validation Flow", () => {
  test("happy path - valid data with supported region", async ({ page }) => {
    // Navigate to the demo page
    await page.goto("/(journey)/journey");

    // Fill out the form with valid data
    await page.fill('label:has-text("Nome")', "João Silva");
    await page.fill('label:has-text("E-mail")', "joao.silva@example.com");
    await page.fill('label:has-text("Telefone")', "(11) 99999-9999");
    await page.fill('label:has-text("Endereço")', "Rua das Flores, 123 - São Paulo - SP");

    // Select persona and goal
    await page.selectOption('label:has-text("Persona")', "owner");
    await page.selectOption('label:has-text("Objetivo")', "viability");

    // Submit the form
    await page.click('button:has-text("Continuar")');

    // Wait for validation result
    await page.waitForSelector('[data-testid="lead-status"]');

    // Verify approved status
    await expect(page.locator('[data-testid="lead-status"]')).toContainText("Aprovado");

    // Verify primary CTA is present
    await expect(page.locator('a:has-text("Prosseguir para Análise")')).toBeVisible();

    // Verify normalized data
    await expect(page.locator("text=+5511999999999")).toBeVisible();
    await expect(page.locator("text=joao.silva@example.com")).toBeVisible();
    await expect(page.locator("text=SP")).toBeVisible();
  });

  test("error path - invalid email", async ({ page }) => {
    await page.goto("/(journey)/journey");

    // Fill with invalid email
    await page.fill('label:has-text("Nome")', "Maria Santos");
    await page.fill('label:has-text("E-mail")', "invalid-email");
    await page.fill('label:has-text("Telefone")', "(11) 88888-8888");
    await page.fill('label:has-text("Endereço")', "Av. Paulista, 1000 - São Paulo - SP");

    await page.selectOption('label:has-text("Persona")', "owner");
    await page.selectOption('label:has-text("Objetivo")', "quote");

    // Submit
    await page.click('button:has-text("Continuar")');

    // Wait for validation
    await page.waitForSelector('[data-testid="lead-status"]');

    // Verify incomplete status
    await expect(page.locator('[data-testid="lead-status"]')).toContainText("Incompleto");

    // Verify error reason
    await expect(page.locator('[data-testid="reason-item"]').first()).toContainText("E-mail inválido");

    // Verify correction CTA
    await expect(page.locator('a:has-text("Corrigir informações")')).toBeVisible();
  });

  test("error path - unsupported region", async ({ page }) => {
    await page.goto("/(journey)/journey");

    // Fill with unsupported region
    await page.fill('label:has-text("Nome")', "Pedro Costa");
    await page.fill('label:has-text("E-mail")', "pedro@example.com");
    await page.fill('label:has-text("Telefone")', "(85) 77777-7777");
    await page.fill('label:has-text("Endereço")', "Rua Fortaleza, 456 - Fortaleza - CE");

    await page.selectOption('label:has-text("Persona")', "integrator");
    await page.selectOption('label:has-text("Objetivo")', "support");

    // Submit
    await page.click('button:has-text("Continuar")');

    // Wait for validation
    await page.waitForSelector('[data-testid="lead-status"]');

    // Verify unsupported region status
    await expect(page.locator('[data-testid="lead-status"]')).toContainText("Fora de cobertura");

    // Verify region error
    await expect(page.locator('[data-testid="reason-item"]')).toContainText("Região não suportada: CE");

    // Verify support CTA
    await expect(page.locator('a:has-text("Falar com Atendimento")')).toBeVisible();
  });

  test("minimal valid data - email and phone only", async ({ page }) => {
    await page.goto("/(journey)/journey");

    // Fill minimal required data (no address, but email + phone)
    await page.fill('label:has-text("Nome")', "Ana Oliveira");
    await page.fill('label:has-text("E-mail")', "ana.oliveira@example.com");
    await page.fill('label:has-text("Telefone")', "(21) 66666-6666");

    await page.selectOption('label:has-text("Persona")', "owner");
    await page.selectOption('label:has-text("Objetivo")', "viability");

    // Submit
    await page.click('button:has-text("Continuar")');

    // Wait for validation
    await page.waitForSelector('[data-testid="lead-status"]');

    // Should be approved since email + phone satisfies minimal rule
    await expect(page.locator('[data-testid="lead-status"]')).toContainText("Aprovado");

    // Verify normalized phone
    await expect(page.locator("text=+5521666666666")).toBeVisible();
  });

  test("form reset functionality", async ({ page }) => {
    await page.goto("/(journey)/journey");

    // Fill form
    await page.fill('label:has-text("Nome")', "Test User");
    await page.fill('label:has-text("E-mail")', "test@example.com");

    // Verify fields are filled
    await expect(page.locator('input[name="name"]')).toHaveValue("Test User");
    await expect(page.locator('input[name="email"]')).toHaveValue("test@example.com");

    // Click reset
    await page.click('button:has-text("Limpar")');

    // Verify fields are cleared
    await expect(page.locator('input[name="name"]')).toHaveValue("");
    await expect(page.locator('input[name="email"]')).toHaveValue("");
  });

  test("loading state during submission", async ({ page }) => {
    await page.goto("/(journey)/journey");

    // Fill minimal data
    await page.fill('label:has-text("Nome")', "Loading Test");
    await page.fill('label:has-text("E-mail")', "loading@example.com");
    await page.fill('label:has-text("Telefone")', "(11) 55555-5555");

    await page.selectOption('label:has-text("Persona")', "owner");
    await page.selectOption('label:has-text("Objetivo")', "viability");

    // Submit and check for loading state
    await page.click('button:has-text("Continuar")');

    // Should show loading text
    await expect(page.locator('button:has-text("Validando...")')).toBeVisible();

    // Wait for completion
    await page.waitForSelector('[data-testid="lead-status"]');

    // Loading should be gone
    await expect(page.locator('button:has-text("Continuar")')).toBeVisible();
  });

  test("wide layout responsiveness", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto("/(journey)/journey?layout=wide");

    // Check if wide layout classes are applied
    const form = page.locator("form");
    await expect(form).toHaveClass(/md:grid-cols-2/);
  });
});