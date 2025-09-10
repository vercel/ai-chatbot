import { renderComponent } from "@autoview/ui";

// Basic solar panel data interface
export interface ISolarPanel {
  id: string;
  model: string;
  manufacturer: string;
  wattage: number;
  efficiency: number;
  price: number;
}

// Basic transformer function for solar panel
export function transformSolarPanel(panel: ISolarPanel) {
  return {
    type: "object",
    properties: {
      id: {
        type: "string",
        title: "ID",
        description: "Unique identifier for the solar panel"
      },
      model: {
        type: "string",
        title: "Model",
        description: "Solar panel model name"
      },
      manufacturer: {
        type: "string",
        title: "Manufacturer",
        description: "Company that manufactures the panel"
      },
      wattage: {
        type: "number",
        title: "Wattage (W)",
        description: "Power output in watts",
        minimum: 0
      },
      efficiency: {
        type: "number",
        title: "Efficiency (%)",
        description: "Solar energy conversion efficiency",
        minimum: 0,
        maximum: 1
      },
      price: {
        type: "number",
        title: "Price ($)",
        description: "Cost of the solar panel",
        minimum: 0
      }
    },
    required: ["id", "model", "manufacturer", "wattage", "efficiency", "price"]
  };
}

// React component for displaying solar panel data
export interface SolarPanelComponentProps {
  panel: ISolarPanel;
}

export default function SolarPanelComponent({ panel }: Readonly<SolarPanelComponentProps>) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {panel.manufacturer} {panel.model}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-medium text-gray-500">Wattage</span>
          <p className="text-lg font-semibold text-blue-600">{panel.wattage}W</p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">Efficiency</span>
          <p className="text-lg font-semibold text-green-600">
            {(panel.efficiency * 100).toFixed(1)}%
          </p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">Price</span>
          <p className="text-lg font-semibold text-gray-900">
            ${panel.price.toLocaleString()}
          </p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">ID</span>
          <p className="text-sm font-mono text-gray-600">{panel.id}</p>
        </div>
      </div>
    </div>
  );
}