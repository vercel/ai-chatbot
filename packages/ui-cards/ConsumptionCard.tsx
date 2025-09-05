import React, { useState, useRef, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export type DataPoint = {
  date: string;
  value: number;
};

type ConsumptionCardProps = {
  externalData?: DataPoint[];
};

export function ConsumptionCard({ externalData }: ConsumptionCardProps) {
  const [data, setData] = useState<DataPoint[]>(externalData ?? []);
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [sanity, setSanity] = useState<string | null>(null);
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      runSanityChecks(externalData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalData]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const rows: DataPoint[] = (result.data as any[])
          .map((r) => ({ date: r.date || r.Date, value: Number(r.value ?? r.Value) }))
          .filter((d) => d.date && !Number.isNaN(d.value));
        setData(rows);
        runSanityChecks(rows);
      },
    });
  };

  const runSanityChecks = (rows: DataPoint[]) => {
    const negative = rows.some((r) => r.value < 0);
    setSanity(negative ? 'Valores negativos detectados.' : null);
  };

  const monthly = useMemo(() => {
    const m = new Map<string, number[]>();
    data.forEach((d) => {
      const month = d.date.slice(0, 7);
      const arr = m.get(month) ?? [];
      arr.push(d.value);
      m.set(month, arr);
    });
    return Array.from(m.entries()).map(([date, values]) => ({
      date,
      value: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  }, [data]);

  const chartData = useMemo(() => {
    const src = view === 'daily' ? data : monthly;
    return {
      labels: src.map((d) => d.date),
      datasets: [
        {
          label: 'kWh',
          data: src.map((d) => d.value),
          borderColor: 'rgb(75,192,192)',
          tension: 0.3,
        },
      ],
    };
  }, [data, monthly, view]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consumption.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consumption.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image('image/png', 1);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consumption.png';
    a.click();
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Consumo</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={exportJSON}>JSON</Button>
          <Button size="sm" onClick={exportCSV}>CSV</Button>
          <Button size="sm" onClick={exportPNG}>PNG</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <input type="file" accept=".csv" onChange={handleImport} />
          <Button
            size="sm"
            variant={view === 'daily' ? 'default' : 'secondary'}
            onClick={() => setView('daily')}
          >
            Diário
          </Button>
          <Button
            size="sm"
            variant={view === 'monthly' ? 'default' : 'secondary'}
            onClick={() => setView('monthly')}
          >
            Mensal
          </Button>
        </div>
        {sanity && <div className="mb-2 text-sm text-red-600">{sanity}</div>}
        <Line ref={chartRef} data={chartData} />
      </CardContent>
    </Card>
  );
}

export default ConsumptionCard;

