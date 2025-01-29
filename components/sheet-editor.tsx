"use client";

import React, { memo } from "react";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import { registerAllModules } from "handsontable/registry";

registerAllModules();

import { HotTable } from "@handsontable/react-wrapper";

interface SpreadsheetData {
  headers: string[];
  rows: string[][];
}

interface SpreadsheetEditorProps {
  content: string;
  saveContent: (updatedContent: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
}

const PureSpreadsheetEditor = ({
  content,
  saveContent,
  status,
  isCurrentVersion,
}: SpreadsheetEditorProps) => {
  const data: SpreadsheetData = content ? JSON.parse(content) : null;

  return data ? (
    <HotTable
      data={[data.headers, ...data.rows]}
      rowHeaders={true}
      colHeaders={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      themeName="ht-theme-main-dark-auto"
      licenseKey="non-commercial-and-evaluation"
      afterChange={() => {
        console.log("save changes");
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
    !(prevProps.status === "streaming" && nextProps.status === "streaming") &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
