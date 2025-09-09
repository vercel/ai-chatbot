'use client';

import React, { useState } from 'react';
import { parse } from 'papaparse';
import { ConsumptionCard, type DataPoint } from '@/packages/ui-cards/ConsumptionCard';
import { FinancialAnalysisCard, type Assumptions } from '@/packages/ui-cards/FinancialAnalysisCard';

const UploadBill: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<{ date?: string; value?: string }>({});
  const [data, setData] = useState<DataPoint[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [pdfPreview, setPdfPreview] = useState<string>('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setData([]);
    setAssumptions(null);
    setPreviewRows([]);
    setPdfPreview('');
    if (file.name.toLowerCase().endsWith('.csv')) {
      parseCSV(file);
    } else if (file.name.toLowerCase().endsWith('.pdf')) {
      parsePDF(file);
    }
  };

  const parseCSV = (file: File) => {
    parse(file, {
      header: true,
      chunk: (results) => {
        if (headers.length === 0) setHeaders(results.meta.fields || []);
        setRawRows((prev) => [...prev, ...results.data]);
        if (previewRows.length < 5) {
          setPreviewRows((prev) => [...prev, ...results.data.slice(0, 5 - prev.length)]);
        }
        setProgress(Math.min((results.meta.cursor / file.size) * 100, 100));
      },
      complete: () => {
        setProgress(100);
      },
    });
  };

  const parsePDF = async (file: File) => {
    const pdfjs = await import('pdfjs-dist');
    // Configure worker for PDF.js
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += `${content.items.map((it: any) => it.str).join(' ')}\n`;
      setProgress((i / doc.numPages) * 100);
    }
    setPdfPreview(text.slice(0, 1000));
    const regex = /(\d{4}-\d{2}-\d{2})\s+(\d+(?:\.\d+)?)/g;
    const rows: DataPoint[] = [];
    let match;
    while ((match = regex.exec(text))) {
      rows.push({ date: match[1], value: Number(match[2]) });
    }
    if (rows.length) {
      setData(rows);
      setAssumptions(computeAssumptions(rows));
    }
    setProgress(100);
  };

  const applyMapping = () => {
    if (!mapping.date || !mapping.value) return;
    const rows: DataPoint[] = rawRows
      .map((r) => ({ date: r[mapping.date!], value: Number(r[mapping.value!]) }))
      .filter((r) => r.date && !Number.isNaN(r.value));
    setData(rows);
    setAssumptions(computeAssumptions(rows));
  };

  const computeAssumptions = (rows: DataPoint[]): Assumptions => {
    const avg = rows.reduce((a, b) => a + b.value, 0) / (rows.length || 1);
    return { tariff: avg, losses: 0.1, years: 5 };
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
          Selecione um arquivo CSV ou PDF
        </label>
        <input 
          id="file-upload"
          type="file" 
          accept=".csv,.pdf" 
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      {progress > 0 && (
        <progress value={progress} max={100} className="w-full" />
      )}
      {headers.length > 0 && data.length === 0 && (
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="date-select" className="text-sm font-medium">Data</label>
            <select
              id="date-select"
              value={mapping.date || ''}
              onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
              className="border p-1 rounded"
            >
              <option value="">Selecione</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="value-select" className="text-sm font-medium">Valor</label>
            <select
              id="value-select"
              value={mapping.value || ''}
              onChange={(e) => setMapping({ ...mapping, value: e.target.value })}
              className="border p-1 rounded"
            >
              <option value="">Selecione</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={applyMapping}
            className="px-2 py-1 border rounded hover:bg-gray-50"
          >
            Aplicar
          </button>
        </div>
      )}
      {previewRows.length > 0 && data.length === 0 && (
        <table className="text-sm border">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="border px-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={`row-${i}-${row[headers[0]] || i}`}>
                {headers.map((h) => (
                  <td key={h} className="border px-1">
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pdfPreview && data.length === 0 && (
        <pre className="max-h-40 overflow-auto border p-2 text-xs">
          {pdfPreview}
        </pre>
      )}
      {data.length > 0 && (
        <div className="space-y-4">
          <ConsumptionCard externalData={data} />
          {assumptions && (
            <FinancialAnalysisCard externalAssumptions={assumptions} />
          )}
        </div>
      )}
    </div>
  );
};

export default UploadBill;

