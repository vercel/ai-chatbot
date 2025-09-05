import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import type { z } from 'zod';
import {
  diff_match_patch,
  DIFF_EQUAL,
  DIFF_INSERT,
} from 'diff-match-patch';

export interface JSONCSVViewerProps<T> {
  value: T;
  schema: z.ZodType<T>;
}

export const JSONCSVViewer = <T,>({ value, schema }: JSONCSVViewerProps<T>) => {
  const initial = useMemo(() => schema.parse(value), [schema, value]);
  const [data, setData] = useState<T>(initial);
  const [activeTab, setActiveTab] = useState<'json' | 'csv'>('json');
  const [error, setError] = useState<string | null>(null);

  const originalJson = useMemo(() => JSON.stringify(initial, null, 2), [initial]);
  const originalCsv = useMemo(() => Papa.unparse(initial as any), [initial]);
  const [jsonText, setJsonText] = useState(originalJson);
  const [csvText, setCsvText] = useState(originalCsv);

  const revertChanges = () => {
    setData(initial);
    setJsonText(originalJson);
    setCsvText(originalCsv);
    setError(null);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);
      setData(validated);
      setCsvText(Papa.unparse(validated as any));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    try {
      const result = Papa.parse(text, { header: true });
      if (result.errors.length) throw new Error(result.errors[0].message);
      const validated = schema.parse(result.data as any);
      setData(validated);
      setJsonText(JSON.stringify(validated, null, 2));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const dmp = useMemo(() => new diff_match_patch(), []);
  const jsonDiff = useMemo(() => {
    const current = JSON.stringify(data, null, 2);
    const list = dmp.diff_main(originalJson, current);
    dmp.diff_cleanupSemantic(list);
    return list;
  }, [dmp, originalJson, data]);

  const csvDiff = useMemo(() => {
    const current = Papa.unparse(data as any);
    const list = dmp.diff_main(originalCsv, current);
    dmp.diff_cleanupSemantic(list);
    return list;
  }, [dmp, originalCsv, data]);

  const diffs = activeTab === 'json' ? jsonDiff : csvDiff;

  return (
    <div className="p-4 border rounded">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`px-2 py-1 border rounded ${
            activeTab === 'json' ? 'bg-gray-200' : ''
          }`}
        >
          JSON
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`px-2 py-1 border rounded ${
            activeTab === 'csv' ? 'bg-gray-200' : ''
          }`}
        >
          CSV
        </button>
        <button
          type="button"
          onClick={revertChanges}
          className="ml-auto px-2 py-1 border rounded"
        >
          Reverter mudanças
        </button>
      </div>
      {activeTab === 'json' ? (
        <textarea
          value={jsonText}
          onChange={handleJsonChange}
          className="w-full h-40 font-mono border p-2"
        />
      ) : (
        <textarea
          value={csvText}
          onChange={handleCsvChange}
          className="w-full h-40 font-mono border p-2"
        />
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <div className="mt-4 whitespace-pre-wrap font-mono text-sm">
        {diffs.map(([op, text]) => {
          const key = `${op}:${text}`;
          if (op === DIFF_EQUAL) return <span key={key}>{text}</span>;
          if (op === DIFF_INSERT)
            return (
              <ins key={key} className="bg-green-200">
                {text}
              </ins>
            );
          return (
            <del key={key} className="bg-red-200">
              {text}
            </del>
          );
        })}
      </div>
    </div>
  );
};

export default JSONCSVViewer;
