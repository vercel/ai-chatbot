'use client';

import { useEffect, useState } from 'react';

interface SourceConfig {
  name: string;
  timeout: number; // milliseconds
  rateLimit: string;
}

type Domain = 'stac' | 'dem' | 'irradiance';

const DEFAULT_CONFIG: Record<Domain, SourceConfig[]> = {
  stac: [
    { name: 'EarthSearch', timeout: 5000, rateLimit: '60 req/min' },
    { name: 'Sentinel Hub', timeout: 5000, rateLimit: '30 req/min' },
    { name: 'Fallback STAC', timeout: 5000, rateLimit: '10 req/min' },
  ],
  dem: [
    { name: 'USGS', timeout: 7000, rateLimit: '40 req/min' },
    { name: 'Copernicus', timeout: 7000, rateLimit: '20 req/min' },
    { name: 'Fallback DEM', timeout: 7000, rateLimit: '10 req/min' },
  ],
  irradiance: [
    { name: 'Solcast', timeout: 8000, rateLimit: '100 req/day' },
    { name: 'NASA POWER', timeout: 8000, rateLimit: '50 req/day' },
    { name: 'Fallback Irradiance', timeout: 8000, rateLimit: '20 req/day' },
  ],
};

interface TelemetryEvent {
  action: string;
  domain: Domain;
  detail?: unknown;
  ts: number;
}

function recordTelemetry(event: Omit<TelemetryEvent, 'ts'>) {
  const telemetry = (window as any).__dataSourceTelemetry || [];
  telemetry.push({ ...event, ts: Date.now() });
  (window as any).__dataSourceTelemetry = telemetry;
}

const STORAGE_KEY = 'integrator-data-sources';

export function DataSourceSelector() {
  const domains: Domain[] = ['stac', 'dem', 'irradiance'];
  const [domain, setDomain] = useState<Domain>('stac');
  const [config, setConfig] = useState<Record<Domain, SourceConfig[]>>(DEFAULT_CONFIG);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<Domain, SourceConfig[]>;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        console.error('Failed to parse data source config', e);
      }
    }
  }, []);

  const persist = (next: Record<Domain, SourceConfig[]>) => {
    setConfig(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const move = (index: number, dir: -1 | 1) => {
    const list = [...config[domain]];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const next = { ...config, [domain]: list };
    persist(next);
    recordTelemetry({ action: 'reorder', domain, detail: { index, dir } });
  };

  const changeTimeout = (index: number, value: number) => {
    const list = config[domain].map((s, i) =>
      i === index ? { ...s, timeout: value } : s,
    );
    const next = { ...config, [domain]: list };
    persist(next);
    recordTelemetry({ action: 'timeout', domain, detail: { index, value } });
  };

  const reset = () => {
    const next = { ...config, [domain]: DEFAULT_CONFIG[domain] };
    persist(next);
    recordTelemetry({ action: 'reset', domain });
  };

  return (
    <div className="flex flex-col gap-4 p-2 border rounded">
      <div className="flex items-center gap-2">
        <label htmlFor="domain" className="text-sm font-medium">
          Domain
        </label>
        <select
          id="domain"
          className="border p-1 rounded"
          value={domain}
          onChange={(e) => {
            const d = e.target.value as Domain;
            setDomain(d);
            recordTelemetry({ action: 'domain', domain: d });
          }}
        >
          {domains.map((d) => (
            <option key={d} value={d}>
              {d.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ml-auto border px-2 py-1 rounded text-xs"
          onClick={reset}
        >
          Reset
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {config[domain].map((src, i) => (
          <div
            key={src.name}
            className="flex items-center gap-2 border p-2 rounded"
          >
            <span className="flex-1 text-sm">{src.name}</span>
            <input
              type="number"
              className="w-20 border p-1 rounded text-sm"
              value={src.timeout}
              onChange={(e) => changeTimeout(i, Number(e.target.value))}
            />
            <span className="text-xs text-gray-500">{src.rateLimit}</span>
            <div className="flex flex-col">
              <button
                type="button"
                className="text-xs border rounded-t px-1"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="text-xs border rounded-b px-1"
                onClick={() => move(i, 1)}
                disabled={i === config[domain].length - 1}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

