import { useState } from 'react';
import Papa from 'papaparse';
import { format } from 'date-fns';

interface LeadRow {
  [key: string]: any;
}

interface Result {
  index: number;
  data: LeadRow;
  error?: string;
}

export function BatchRunner() {
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [running, setRunning] = useState(false);

  const simulate = async (row: LeadRow) => {
    if (!row.email) {
      throw new Error('Email missing');
    }
    return new Promise<void>((resolve) => setTimeout(resolve, 50));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<LeadRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data;
        setTotal(rows.length);
        setResults([]);
        setProgress(0);
        setRunning(true);
        const processedRows: Result[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            await simulate(row);
            processedRows.push({ index: i + 1, data: row });
          } catch (err: any) {
            processedRows.push({ index: i + 1, data: row, error: err.message });
          }
          setProcessed(i + 1);
          setProgress(Math.round(((i + 1) / rows.length) * 100));
          setResults([...processedRows]);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        setRunning(false);
      },
    });
  };

  const exportReport = (type: 'json' | 'csv') => {
    if (results.length === 0) return;
    const start = results[0].index;
    const end = results[results.length - 1].index;
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `batch_${start}-${end}_${timestamp}.${type}`;
    const errorRows = results.filter((r) => r.error);
    const summary = {
      start,
      end,
      total: results.length,
      success: results.length - errorRows.length,
      errors: errorRows,
      results,
    };

    let content = '';
    let mime = '';
    if (type === 'json') {
      content = JSON.stringify(summary, null, 2);
      mime = 'application/json';
    } else {
      content = Papa.unparse(results);
      mime = 'text/csv';
    }

    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const errorRows = results.filter((r) => r.error);

  return (
    <div className="space-y-4">
      <input type="file" accept=".csv" onChange={handleUpload} />
      {running && (
        <div>
          <div className="h-2 bg-gray-200">
            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm">
            {processed}/{total} ({progress}%)
          </p>
        </div>
      )}
      {results.length > 0 && !running && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="px-2 py-1 bg-gray-200 rounded"
              onClick={() => exportReport('json')}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-gray-200 rounded"
              onClick={() => exportReport('csv')}
            >
              Export CSV
            </button>
          </div>
          {errorRows.length > 0 && (
            <div>
              <h3 className="font-semibold">Errors</h3>
              <ul className="list-disc pl-5 text-sm">
                {errorRows.map((r) => (
                  <li key={r.index}>
                    Row {r.index}: {r.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BatchRunner;
