import type { PageRecord } from "@/lib/server/pages";

export type GridPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ListFilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "is_null"
  | "is_not_null";

export const LIST_FILTER_OPERATORS: readonly ListFilterOperator[] = [
  "equals",
  "not_equals",
  "contains",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "is_null",
  "is_not_null",
];

export type ListBlockFilter = {
  id: string;
  column: string;
  operator: ListFilterOperator;
  value: string;
};

export type ListDisplayFormat = "table" | "cards" | "grid";
export const LIST_DISPLAY_FORMATS: readonly ListDisplayFormat[] = [
  "table",
  "cards",
  "grid",
];
export type RecordDisplayMode = "read" | "edit" | "create";
export const RECORD_DISPLAY_MODES: readonly RecordDisplayMode[] = [
  "read",
  "edit",
  "create",
];
export type RecordDisplayFormat = "table" | "form";
export const RECORD_DISPLAY_FORMATS: readonly RecordDisplayFormat[] = [
  "table",
  "form",
];
export type TriggerActionType = "default" | "destructive" | "primary";
export const TRIGGER_ACTION_TYPES: readonly TriggerActionType[] = [
  "default",
  "destructive",
  "primary",
];
export type ReportChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "radar";
export const REPORT_CHART_TYPES: readonly ReportChartType[] = [
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "radar",
];

export type ListBlockDraft = {
  id: string;
  type: "list";
  position: GridPosition;
  tableName: string;
  filters: ListBlockFilter[];
  display: {
    format: ListDisplayFormat;
    showActions: boolean;
    editable: boolean;
    columns: string[];
  };
};

export type RecordBlockDraft = {
  id: string;
  type: "record";
  position: GridPosition;
  tableName: string;
  recordId: string;
  display: {
    mode: RecordDisplayMode;
    format: RecordDisplayFormat;
    columns: string[];
  };
};

export type ReportBlockDraft = {
  id: string;
  type: "report";
  position: GridPosition;
  reportId: string;
  display: {
    chartType: ReportChartType;
    title: string;
  };
};

export type TriggerBlockDraft = {
  id: string;
  type: "trigger";
  position: GridPosition;
  display: {
    buttonText: string;
    actionType: TriggerActionType;
    requireConfirmation: boolean;
    confirmationText: string;
    hookName: string;
  };
};

export type PageBlockDraft =
  | ListBlockDraft
  | RecordBlockDraft
  | ReportBlockDraft
  | TriggerBlockDraft;

export type PageUrlParamDraft = {
  id: string;
  name: string;
  required: boolean;
  description?: string;
};

export type PageDraft = {
  id: string;
  name: string;
  description: string | null;
  blocks: PageBlockDraft[];
  settings: {
    urlParams: PageUrlParamDraft[];
    hideHeader?: boolean;
    [key: string]: unknown;
  };
  layout: Record<string, unknown>;
};

export type PageSavePayload = {
  id: string;
  name: string;
  description: string | null;
  blocks: PageRecord["blocks"];
  settings: PageRecord["settings"];
  layout: PageRecord["layout"];
};

