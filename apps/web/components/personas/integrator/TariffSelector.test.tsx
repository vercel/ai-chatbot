import React, { createRef } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TariffSelector } from "./TariffSelector";
import { computeIndicators } from "../../../../../packages/ui-cards/FinancialAnalysisCard";

describe("TariffSelector", () => {
  afterEach(() => {
    cleanup();
  });
  it("filters by UF", async () => {
    render(<TariffSelector />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("UF"), "RJ");
    const select = screen.getByLabelText("Tarifa/Distribuidora");
    const options = within(select).getAllByRole("option");
    // includes 'Selecione' disabled option and RJ Energy
    expect(options).toHaveLength(2);
    expect(within(select).queryByText("RJ Energy")).not.toBeNull();
  });

  it("searches by distributor name", async () => {
    render(<TariffSelector />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Pesquisa"), "Light");
    const select = screen.getByLabelText("Tarifa/Distribuidora");
    expect(within(select).queryByText("MG Light")).not.toBeNull();
  });

  it("shows validity notice when selecting", async () => {
    render(<TariffSelector />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Tarifa/Distribuidora"), "sp");
    expect(screen.getByText(/Vigência até/).textContent).toContain("31/12/2025");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<TariffSelector ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("integrates with financial analysis", async () => {
    const onSelect = vi.fn();
    render(<TariffSelector onSelect={onSelect} />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Tarifa/Distribuidora"), "rj");
    const selected = onSelect.mock.calls[0][0];
    const { roi } = computeIndicators({ tariff: selected.price, losses: 0, years: 1 });
    expect(typeof roi).toBe("number");
  });
});
