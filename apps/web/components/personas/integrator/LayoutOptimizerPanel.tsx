"use client";

import React, { useState } from "react";
import { Roof3DViewer } from "../../../../../packages/ui-viewers/Roof3DViewer";

const clamp = (value: number, min: number, max?: number) => {
  if (max === undefined) return value < min ? min : value;
  return Math.min(Math.max(value, min), max);
};

type LayoutCardProps = {
  tilt: number;
  azimuth: number;
  spacing: number;
};

const LayoutCard: React.FC<LayoutCardProps> = ({ tilt, azimuth, spacing }) => (
  <div className="p-2 border rounded" aria-label="layout card">
    <div>Tilt: {tilt}°</div>
    <div>Azimuth: {azimuth}°</div>
    <div>Spacing: {spacing}m</div>
  </div>
);

const DEFAULTS = { tilt: 30, azimuth: 180, spacing: 1 };
const OPTIMIZED = { tilt: 35, azimuth: 170, spacing: 1.2 };

export function LayoutOptimizerPanel() {
  const [tilt, setTilt] = useState(DEFAULTS.tilt);
  const [azimuth, setAzimuth] = useState(DEFAULTS.azimuth);
  const [spacing, setSpacing] = useState(DEFAULTS.spacing);

  const handleTilt = (v: number) => setTilt(clamp(v, 0, 90));
  const handleAzimuth = (v: number) => setAzimuth(clamp(v, 0, 360));
  const handleSpacing = (v: number) => setSpacing(clamp(Number.isNaN(v) ? 0 : v, 0));

  const auto = () => {
    setTilt(DEFAULTS.tilt);
    setAzimuth(DEFAULTS.azimuth);
    setSpacing(DEFAULTS.spacing);
  };

  const optimize = () => {
    setTilt(OPTIMIZED.tilt);
    setAzimuth(OPTIMIZED.azimuth);
    setSpacing(OPTIMIZED.spacing);
  };

  return (
    <div className="flex flex-col gap-4">
      <Roof3DViewer />
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <span className="w-20">Tilt</span>
          <input
            type="number"
            value={tilt}
            onChange={(e) => handleTilt(Number(e.target.value))}
            min={0}
            max={90}
            aria-label="tilt"
            className="border p-1 rounded w-20"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-20">Azimuth</span>
          <input
            type="number"
            value={azimuth}
            onChange={(e) => handleAzimuth(Number(e.target.value))}
            min={0}
            max={360}
            aria-label="azimuth"
            className="border p-1 rounded w-20"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-20">Spacing</span>
          <input
            type="number"
            value={spacing}
            onChange={(e) => handleSpacing(Number(e.target.value))}
            min={0}
            step="0.1"
            aria-label="spacing"
            className="border p-1 rounded w-20"
          />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={auto} className="px-2 py-1 border rounded" aria-label="auto">
            auto
          </button>
          <button
            type="button"
            onClick={optimize}
            className="px-2 py-1 border rounded"
            aria-label="otimizar"
          >
            otimizar
          </button>
        </div>
      </div>
      <LayoutCard tilt={tilt} azimuth={azimuth} spacing={spacing} />
    </div>
  );
}
