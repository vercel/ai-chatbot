"use client";

import type { DimensioningResult } from "@/lib/dimensioning/types";

type DimensioningSpecProps = {
  readonly result: DimensioningResult;
  readonly className?: string;
};

export function DimensioningSpec({ result, className }: DimensioningSpecProps) {
  const { selection, layout, strings, bom, notes } = result;

  const exportBOM = () => {
    const csv = [
      ["Item", "Modelo", "Quantidade", "Potência"],
      [bom.modules.model, bom.modules.model, bom.modules.quantity, `${bom.modules.wp} Wp`],
      [bom.inverter.model, bom.inverter.model, 1, `${bom.inverter.ac_kw} kW`],
      ...bom.dc_protections.map(p => ["Proteção DC", p, 1, ""]),
      ...bom.ac_protections.map(p => ["Proteção AC", p, 1, ""])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bom_dimensioning.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold mb-6">Resultado do Dimensionamento</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold yello-gradient-text">{selection.dc_kwp.toFixed(1)} kWp</div>
          <div className="text-sm">Potência DC</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold yello-gradient-text">{selection.ac_kw} kW</div>
          <div className="text-sm">Potência AC</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold yello-gradient-text">{selection.dcac_ratio.toFixed(2)}</div>
          <div className="text-sm">DC/AC Ratio</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold yello-gradient-text">{layout.sections.reduce((sum, s) => sum + s.panels_count, 0)}</div>
          <div className="text-sm">Total de Painéis</div>
        </div>
      </div>

      {/* Layout por Seção */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Layout por Seção</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2" scope="col">Seção</th>
                <th className="border border-gray-300 p-2" scope="col">Orientação</th>
                <th className="border border-gray-300 p-2" scope="col">Painéis</th>
                <th className="border border-gray-300 p-2" scope="col">Linhas</th>
                <th className="border border-gray-300 p-2" scope="col">Colunas</th>
                <th className="border border-gray-300 p-2" scope="col">Área (m²)</th>
                <th className="border border-gray-300 p-2" scope="col">Densidade (Wp/m²)</th>
              </tr>
            </thead>
            <tbody>
              {layout.sections.map((section) => (
                <tr key={section.id}>
                  <td className="border border-gray-300 p-2" scope="row">{section.id}</td>
                  <td className="border border-gray-300 p-2">{section.orientation}</td>
                  <td className="border border-gray-300 p-2">{section.panels_count}</td>
                  <td className="border border-gray-300 p-2">{section.panels_rows}</td>
                  <td className="border border-gray-300 p-2">{section.panels_cols}</td>
                  <td className="border border-gray-300 p-2">{section.used_area_m2.toFixed(1)}</td>
                  <td className="border border-gray-300 p-2">{section.density_wp_m2.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagrama SVG */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Diagrama do Layout</h3>
        <svg width="400" height="200" className="border">
          {layout.sections.map((section, index) => {
            const x = 20 + index * 120;
            const y = 20;
            const width = section.panels_cols * 10;
            const height = section.panels_rows * 10;
            return (
              <g key={section.id}>
                <rect x={x} y={y} width={width} height={height} fill="none" stroke="currentColor" />
                <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize="12">
                  {section.id}
                </text>
                <text x={x + width / 2} y={y + height + 15} textAnchor="middle" fontSize="10">
                  {section.panels_count} painéis
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Strings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Configuração de Strings</h3>
        {strings.mppts.map((mppt) => (
          <div key={mppt.mppt_id} className="mb-4">
            <h4 className="font-medium">MPPT {mppt.mppt_id}</h4>
            <ul className="list-disc list-inside">
              {mppt.strings.map((str, idx) => (
                <li key={`str-${mppt.mppt_id}-${idx}`}>
                  String {idx + 1}: {str.modules} módulos, {str.Vmpp_est.toFixed(1)} V, {str.Voc_est.toFixed(1)} V
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* BOM */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Lista de Materiais (BOM)</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Módulos {bom.modules.model}</span>
            <span>{bom.modules.quantity} un x {bom.modules.wp} Wp</span>
          </div>
          <div className="flex justify-between">
            <span>Inversor {bom.inverter.model}</span>
            <span>1 un x {bom.inverter.ac_kw} kW</span>
          </div>
          <div>
            <h4 className="font-medium">Proteções DC:</h4>
            <ul className="list-disc list-inside">
              {bom.dc_protections.map((p, idx) => <li key={`dc-${idx}`}>{p}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Proteções AC:</h4>
            <ul className="list-disc list-inside">
              {bom.ac_protections.map((p, idx) => <li key={idx}>{p}</li>)}
            </ul>
          </div>
        </div>
        {result.inputs.persona === "integrator" && (
          <button
            onClick={exportBOM}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded focus-yello"
          >
            Exportar BOM (CSV)
          </button>
        )}
      </div>

      {/* Observações */}
      {notes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <ul className="list-disc list-inside">
            {notes.map((note, idx) => <li key={idx}>{note}</li>)}
          </ul>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.href = "/journey/simulation"}
          className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded focus-yello"
        >
          Prosseguir para Simulação
        </button>
        <button
          onClick={() => window.location.href = "/journey"}
          className="flex-1 py-3 bg-gray-500 text-white font-semibold rounded focus-yello"
        >
          Voltar para Jornada
        </button>
      </div>
    </div>
  );
}