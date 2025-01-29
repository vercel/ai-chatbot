'use client';

import React, { memo, useMemo } from 'react';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { parse, unparse } from 'papaparse';

interface SheetEditorProps {
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
}: SheetEditorProps) => {
  const parseData = (csvContent: string) => {
    if (!csvContent) return null;
    const result = parse<string[]>(csvContent, { skipEmptyLines: true });
    return result.data;
  };

  const generateCsv = (data: any[][]) => {
    return unparse(data);
  };

  const rawData = parseData(content);

  const columns = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const columnCount = Math.max(...rawData.map((row) => row.length));
    return Array.from({ length: columnCount }, (_, i) => ({
      key: i.toString(),
      name: String.fromCharCode(65 + i),
      editor: 'textEditor',
      editable: true,
    }));
  }, [rawData]);

  const rows = useMemo(() => {
    if (!rawData) return [];

    return rawData.map((row, rowIndex) => {
      const rowData: any = { id: rowIndex };

      columns.forEach((col, colIndex) => {
        rowData[col.key] = row[colIndex] || '';
      });

      return rowData;
    });
  }, [rawData, columns]);

  function onCellEdit(rowIndex: number, columnKey: string, newValue: string) {
    if (!isCurrentVersion) return;

    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [columnKey]: newValue };

    // Convert the rows back to 2D array format
    const newData = newRows.map((row) =>
      columns.map((col) => row[col.key] || ''),
    );

    const updatedCsv = generateCsv(newData);
    saveContent(updatedCsv, true);
  }

  return rawData ? (
    <div style={{ height: '100%', width: '100%' }}>
      <DataGrid
        columns={columns}
        rows={rows}
        onCellClick={(args) => {
          args.selectCell();
        }}
        onCellKeyDown={(args) => {
          if (args.mode !== 'EDIT' && args.row.id !== undefined) {
            args.enableEditMode();
          }
        }}
        onRowsChange={(newRows, { indexes, column }) => {
          if (indexes.length === 1) {
            const rowIndex = indexes[0];
            const newValue = newRows[rowIndex][column.key];
            onCellEdit(rowIndex, column.key, newValue);
          }
        }}
        style={{ height: '100%' }}
        defaultColumnOptions={{
          resizable: true,
          sortable: true,
        }}
      />
    </div>
  ) : null;
};

function areEqual(prevProps: SheetEditorProps, nextProps: SheetEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
