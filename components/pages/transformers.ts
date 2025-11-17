import { nanoid } from "nanoid";
import type { PageRecord } from "@/lib/server/pages";
import type {
  GridPosition,
  ListBlockDraft,
  ListBlockFilter,
  ListDisplayFormat,
  ListFilterOperator,
  PageBlockDraft,
  PageDraft,
  PageSavePayload,
  PageUrlParamDraft,
  RecordBlockDraft,
  RecordDisplayFormat,
  RecordDisplayMode,
  ReportBlockDraft,
  ReportChartType,
  TriggerActionType,
  TriggerBlockDraft,
} from "./types";

const DEFAULT_POSITION: GridPosition = {
  x: 0,
  y: 0,
  width: 12,
  height: 4,
};

const LIST_FORMATS: ListDisplayFormat[] = ["table", "cards", "grid"];
const RECORD_FORMATS: RecordDisplayFormat[] = ["table", "form"];
const RECORD_MODES: RecordDisplayMode[] = ["read", "edit", "create"];
const REPORT_CHARTS: ReportChartType[] = [
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "radar",
];
const TRIGGER_ACTIONS: TriggerActionType[] = [
  "default",
  "destructive",
  "primary",
];
const LIST_OPERATORS: ListFilterOperator[] = [
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

export function pageRecordToDraft(page: PageRecord): PageDraft {
  return {
    id: page.id,
    name: page.name,
    description: page.description,
    layout: page.layout ?? {},
    blocks: (page.blocks ?? []).map(normalizeBlock),
    settings: {
      ...page.settings,
      urlParams: normalizeUrlParams(page.settings?.urlParams),
    },
  };
}

export function draftToSavePayload(draft: PageDraft): PageSavePayload {
  return {
    id: draft.id,
    name: draft.name,
    description: draft.description,
    layout: draft.layout,
    blocks: draft.blocks.map(serializeBlock),
    settings: {
      ...draft.settings,
      urlParams: draft.settings.urlParams.map((param) => ({
        name: param.name,
        required: param.required,
        description: param.description ?? undefined,
      })),
    },
  };
}

function normalizeUrlParams(
  params: unknown
): PageUrlParamDraft[] {
  if (!Array.isArray(params)) {
    return [];
  }

  return params
    .map((param) => {
      if (!param || typeof param !== "object") {
        return null;
      }
      const record = param as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "";
      if (!name) {
        return null;
      }
      const required =
        typeof record.required === "boolean" ? record.required : false;
      const description =
        typeof record.description === "string" ? record.description : undefined;
      return {
        id: nanoid(8),
        name,
        required,
        description,
      };
    })
    .filter((param): param is PageUrlParamDraft => param !== null);
}

function normalizeBlock(block: unknown): PageBlockDraft {
  if (!block || typeof block !== "object") {
    return createDefaultListBlock();
  }

  const record = block as Record<string, unknown>;
  const id = typeof record.id === "string" && record.id
    ? record.id
    : `block-${nanoid(6)}`;
  const type = record.type;

  switch (type) {
    case "list":
      return normalizeListBlock(id, record);
    case "record":
      return normalizeRecordBlock(id, record);
    case "report":
      return normalizeReportBlock(id, record);
    case "trigger":
      return normalizeTriggerBlock(id, record);
    default:
      return createDefaultListBlock(id);
  }
}

function normalizeListBlock(
  id: string,
  block: Record<string, unknown>
): ListBlockDraft {
  const dataSource = (block.dataSource ?? {}) as Record<string, unknown>;
  const displayConfig = (block.displayConfig ?? {}) as Record<string, unknown>;

  const tableName =
    typeof dataSource.tableName === "string" ? dataSource.tableName : "";

  const filtersObj = (dataSource.filters ?? {}) as Record<
    string,
    { operator?: string; value?: unknown }
  >;

  const filters = Object.entries(filtersObj).map<ListBlockFilter>(
    ([rawKey, filterConfig]) => ({
      id: nanoid(10),
      column: parseFilterColumn(rawKey),
      operator: parseListOperator(filterConfig.operator),
      value: inferFilterValue(filterConfig.value),
    })
  );

  const format = parseListFormat(displayConfig.format);
  const showActions =
    typeof displayConfig.showActions === "boolean"
      ? displayConfig.showActions
      : true;
  const editable =
    typeof displayConfig.editable === "boolean"
      ? displayConfig.editable
      : false;
  const columns = Array.isArray(displayConfig.columns)
    ? displayConfig.columns.filter((column): column is string =>
        typeof column === "string" && column.length > 0
      )
    : [];

  return {
    id,
    type: "list",
    position: normalizePosition(block.position),
    tableName,
    filters,
    display: {
      format,
      showActions,
      editable,
      columns,
    },
  };
}

function normalizeRecordBlock(
  id: string,
  block: Record<string, unknown>
): RecordBlockDraft {
  const dataSource = (block.dataSource ?? {}) as Record<string, unknown>;
  const displayConfig = (block.displayConfig ?? {}) as Record<string, unknown>;

  const tableName =
    typeof dataSource.tableName === "string" ? dataSource.tableName : "";
  const recordId =
    typeof dataSource.recordId === "string" ? dataSource.recordId : "";

  const mode = parseRecordMode(displayConfig.mode);
  const format = parseRecordFormat(displayConfig.format);
  const columns = Array.isArray(displayConfig.columns)
    ? displayConfig.columns.filter((column): column is string =>
        typeof column === "string" && column.length > 0
      )
    : [];

  return {
    id,
    type: "record",
    position: normalizePosition(block.position),
    tableName,
    recordId,
    display: {
      mode,
      format,
      columns,
    },
  };
}

function normalizeReportBlock(
  id: string,
  block: Record<string, unknown>
): ReportBlockDraft {
  const dataSource = (block.dataSource ?? {}) as Record<string, unknown>;
  const displayConfig = (block.displayConfig ?? {}) as Record<string, unknown>;

  const reportId =
    typeof dataSource.reportId === "string" ? dataSource.reportId : "";
  const chartType = parseReportChart(displayConfig.chartType);
  const title =
    typeof displayConfig.title === "string" ? displayConfig.title : "";

  return {
    id,
    type: "report",
    position: normalizePosition(block.position),
    reportId,
    display: {
      chartType,
      title,
    },
  };
}

function normalizeTriggerBlock(
  id: string,
  block: Record<string, unknown>
): TriggerBlockDraft {
  const displayConfig = (block.displayConfig ?? {}) as Record<string, unknown>;

  const buttonText =
    typeof displayConfig.buttonText === "string"
      ? displayConfig.buttonText
      : "Run action";
  const actionType = parseTriggerAction(displayConfig.actionType);
  const requireConfirmation =
    typeof displayConfig.requireConfirmation === "boolean"
      ? displayConfig.requireConfirmation
      : false;
  const confirmationText =
    typeof displayConfig.confirmationText === "string"
      ? displayConfig.confirmationText
      : "Are you sure?";
  const hookName =
    typeof displayConfig.hookName === "string" ? displayConfig.hookName : "";

  return {
    id,
    type: "trigger",
    position: normalizePosition(block.position),
    display: {
      buttonText,
      actionType,
      requireConfirmation,
      confirmationText,
      hookName,
    },
  };
}

function createDefaultListBlock(id?: string): ListBlockDraft {
  return {
    id: id ?? `block-${nanoid(6)}`,
    type: "list",
    position: { ...DEFAULT_POSITION },
    tableName: "",
    filters: [],
    display: {
      format: "table",
      showActions: true,
      editable: false,
      columns: [],
    },
  };
}

function createDefaultRecordBlock(id?: string): RecordBlockDraft {
  return {
    id: id ?? `block-${nanoid(6)}`,
    type: "record",
    position: { ...DEFAULT_POSITION },
    tableName: "",
    recordId: "",
    display: {
      mode: "read",
      format: "form",
      columns: [],
    },
  };
}

function createDefaultReportBlock(id?: string): ReportBlockDraft {
  return {
    id: id ?? `block-${nanoid(6)}`,
    type: "report",
    position: { ...DEFAULT_POSITION },
    reportId: "",
    display: {
      chartType: "bar",
      title: "",
    },
  };
}

function createDefaultTriggerBlock(id?: string): TriggerBlockDraft {
  return {
    id: id ?? `block-${nanoid(6)}`,
    type: "trigger",
    position: { ...DEFAULT_POSITION },
    display: {
      buttonText: "Run action",
      actionType: "default",
      requireConfirmation: false,
      confirmationText: "Are you sure?",
      hookName: "",
    },
  };
}

function normalizePosition(position: unknown): GridPosition {
  if (!position || typeof position !== "object") {
    return { ...DEFAULT_POSITION };
  }

  const record = position as Record<string, unknown>;
  const x = parseIntOrDefault(record.x, 0);
  const y = parseIntOrDefault(record.y, 0);
  const width = clamp(parseIntOrDefault(record.width, 12), 1, 12);
  const height = clamp(parseIntOrDefault(record.height, 4), 1, 12);

  return { x, y, width, height };
}

function parseIntOrDefault(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseFilterColumn(rawKey: string): string {
  const match = /^filter\[(.+)]$/.exec(rawKey);
  if (match) {
    return match[1] ?? "";
  }
  return rawKey;
}

function parseListOperator(operator: unknown): ListFilterOperator {
  if (typeof operator === "string") {
    if ((LIST_OPERATORS as string[]).includes(operator)) {
      return operator as ListFilterOperator;
    }
  }
  return "equals";
}

function inferFilterValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function parseListFormat(format: unknown): ListDisplayFormat {
  if (typeof format === "string") {
    if ((LIST_FORMATS as string[]).includes(format)) {
      return format as ListDisplayFormat;
    }
  }
  return "table";
}

function parseRecordMode(mode: unknown): RecordDisplayMode {
  if (typeof mode === "string") {
    if ((RECORD_MODES as string[]).includes(mode)) {
      return mode as RecordDisplayMode;
    }
  }
  return "read";
}

function parseRecordFormat(format: unknown): RecordDisplayFormat {
  if (typeof format === "string") {
    if ((RECORD_FORMATS as string[]).includes(format)) {
      return format as RecordDisplayFormat;
    }
  }
  return "form";
}

function parseReportChart(chart: unknown): ReportChartType {
  if (typeof chart === "string") {
    if ((REPORT_CHARTS as string[]).includes(chart)) {
      return chart as ReportChartType;
    }
  }
  return "bar";
}

function parseTriggerAction(action: unknown): TriggerActionType {
  if (typeof action === "string") {
    if ((TRIGGER_ACTIONS as string[]).includes(action)) {
      return action as TriggerActionType;
    }
  }
  return "default";
}

function serializeBlock(block: PageBlockDraft): Record<string, unknown> {
  switch (block.type) {
    case "list":
      return serializeListBlock(block);
    case "record":
      return serializeRecordBlock(block);
    case "report":
      return serializeReportBlock(block);
    case "trigger":
      return serializeTriggerBlock(block);
    default:
      return serializeListBlock(createDefaultListBlock());
  }
}

function serializeListBlock(
  block: ListBlockDraft
): Record<string, unknown> {
  const filters = block.filters.reduce<Record<string, unknown>>(
    (accumulator, filter) => {
      if (!filter.column) {
        return accumulator;
      }

      accumulator[`filter[${filter.column}]`] = {
        operator: filter.operator,
        value: filter.value,
      };
      return accumulator;
    },
    {}
  );

  return {
    id: block.id,
    type: "list",
    position: { ...block.position },
    dataSource: {
      type: "table",
      tableName: block.tableName,
      filters,
    },
    displayConfig: {
      format: block.display.format,
      showActions: block.display.showActions,
      editable: block.display.editable,
      columns: block.display.columns,
    },
  };
}

function serializeRecordBlock(
  block: RecordBlockDraft
): Record<string, unknown> {
  return {
    id: block.id,
    type: "record",
    position: { ...block.position },
    dataSource: {
      type: "record",
      tableName: block.tableName,
      recordId: block.recordId,
    },
    displayConfig: {
      mode: block.display.mode,
      format: block.display.format,
      columns: block.display.columns,
    },
  };
}

function serializeReportBlock(
  block: ReportBlockDraft
): Record<string, unknown> {
  return {
    id: block.id,
    type: "report",
    position: { ...block.position },
    dataSource: {
      type: "report",
      reportId: block.reportId,
    },
    displayConfig: {
      chartType: block.display.chartType,
      title: block.display.title,
    },
  };
}

function serializeTriggerBlock(
  block: TriggerBlockDraft
): Record<string, unknown> {
  return {
    id: block.id,
    type: "trigger",
    position: { ...block.position },
    dataSource: {},
    displayConfig: {
      buttonText: block.display.buttonText,
      actionType: block.display.actionType,
      requireConfirmation: block.display.requireConfirmation,
      confirmationText: block.display.confirmationText,
      hookName: block.display.hookName,
    },
  };
}

export function createBlockDraft(type: PageBlockDraft["type"]): PageBlockDraft {
  switch (type) {
    case "list":
      return createDefaultListBlock();
    case "record":
      return createDefaultRecordBlock();
    case "report":
      return createDefaultReportBlock();
    case "trigger":
      return createDefaultTriggerBlock();
    default:
      return createDefaultListBlock();
  }
}

