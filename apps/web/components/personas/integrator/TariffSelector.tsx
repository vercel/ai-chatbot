"use client";

import React, { forwardRef, useMemo, useState } from "react";

export interface Tariff {
  id: string;
  distributor: string;
  uf: string;
  price: number;
  validUntil: string; // ISO date string
}

const tariffs: Tariff[] = [
  {
    id: "sp",
    distributor: "SP Power",
    uf: "SP",
    price: 0.6,
    validUntil: "2025-12-31",
  },
  {
    id: "rj",
    distributor: "RJ Energy",
    uf: "RJ",
    price: 0.55,
    validUntil: "2024-06-30",
  },
  {
    id: "mg",
    distributor: "MG Light",
    uf: "MG",
    price: 0.58,
    validUntil: "2024-12-31",
  },
];

export interface TariffSelectorProps {
  onSelect?: (tariff: Tariff) => void;
  className?: string;
}

export const TariffSelector = forwardRef<HTMLSelectElement, TariffSelectorProps>(
  ({ onSelect, className }, ref) => {
    const [search, setSearch] = useState("");
    const [uf, setUf] = useState("");
    const [selected, setSelected] = useState("");

    const ufs = useMemo(
      () => Array.from(new Set(tariffs.map((t) => t.uf))).sort(),
      [],
    );

    const filtered = useMemo(
      () =>
        tariffs.filter(
          (t) =>
            (uf === "" || t.uf === uf) &&
            t.distributor.toLowerCase().includes(search.toLowerCase()),
        ),
      [search, uf],
    );

    const current = tariffs.find((t) => t.id === selected);

    return (
      <div className={className}>
        <div className="flex gap-2 mb-2">
          <label className="flex flex-col text-sm">
            Pesquisa
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-1 rounded"
            />
          </label>
          <label className="flex flex-col text-sm">
            UF
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="border p-1 rounded"
            >
              <option value="">Todas</option>
              {ufs.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col text-sm">
          Tarifa/Distribuidora
          <select
            ref={ref}
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              const tariff = tariffs.find((t) => t.id === e.target.value);
              if (tariff && onSelect) onSelect(tariff);
            }}
            className="border p-1 rounded"
          >
            <option value="" disabled>
              Selecione
            </option>
            {filtered.map((t) => (
              <option key={t.id} value={t.id}>
                {t.distributor}
              </option>
            ))}
          </select>
        </label>
        {current && (
          <p className="mt-1 text-xs text-gray-500">
            Vigência até {new Date(current.validUntil).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    );
  },
);

TariffSelector.displayName = "TariffSelector";

export default TariffSelector;
