'use client';

import React, { memo } from 'react';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { registerAllModules } from 'handsontable/registry';
import { parse, unparse } from 'papaparse';

registerAllModules();

import { HotTable } from '@handsontable/react-wrapper';

interface SpreadsheetData {
  headers: string[];
  rows: string[][];
}

interface SpreadsheetEditorProps {
  content: string;
  saveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
}

const PureSpreadsheetEditor = ({
  content,
  saveContent,
  status,
  isCurrentVersion,
}: SpreadsheetEditorProps) => {
  const parseData = (csvContent: string): string[][] | null => {
    if (!csvContent) return null;

    const result = parse<string[]>(csvContent, { skipEmptyLines: true });
    return result.data;
  };

  const generateCsv = (data: string[][]) => {
    return unparse(data);
  };

  const data = parseData(content);

  return data ? (
    <HotTable
      data={data}
      rowHeaders={true}
      colHeaders={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      themeName="ht-theme-main-dark-auto"
      licenseKey="non-commercial-and-evaluation"
      customBorders={false}
      afterChange={(changes) => {
        if (changes && isCurrentVersion) {
          const newData: string[][] = data.map((row) => [...row]);

          changes.forEach(([row, prop, _, newValue]) => {
            if (typeof row === 'number' && typeof prop === 'number') {
              newData[row][prop] = String(newValue);
            }
          });

          const updatedCsv = generateCsv(newData);
          saveContent(updatedCsv, true);
        }
      }}
    />
  ) : null;
};

function areEqual(
  prevProps: SpreadsheetEditorProps,
  nextProps: SpreadsheetEditorProps,
) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
