import type { ListBlockDraft, PageBlockDraft, PageDraft } from "./types";

export type PageTemplate = {
  id: string;
  name: string;
  description: string;
  preview: TemplateRow[];
  blocks: PageBlockDraft[];
  settings?: Partial<PageDraft["settings"]>;
};

export type TemplateRow = {
  columns: Array<{
    span: number;
    label?: string;
    variant?: "record" | "list" | "trigger" | "report";
  }>;
};

const defaultListBlock = (id: string, tableName: string): ListBlockDraft => ({
  id,
  type: "list",
  position: { x: 0, y: 0, width: 12, height: 4 },
  tableName,
  filters: [],
  display: {
    format: "table",
    showActions: true,
    editable: false,
    columns: [],
  },
});

const defaultRecordBlock = (
  id: string,
  tableName: string,
  recordId: string
): PageBlockDraft => ({
  id,
  type: "record",
  position: { x: 0, y: 0, width: 12, height: 6 },
  tableName,
  recordId,
  display: {
    mode: "read",
    format: "form",
    columns: [],
  },
});

export const pageTemplates: PageTemplate[] = [
  {
    id: "detail-view",
    name: "Detail view",
    description:
      "Record details with audit log and workflow runs filtered to the current record.",
    preview: [
      { columns: [{ span: 12, label: "Record", variant: "record" }] },
      {
        columns: [
          { span: 6, label: "Audit log", variant: "list" },
          { span: 6, label: "Runs", variant: "list" },
        ],
      },
    ],
    settings: {
      urlParams: [
        {
          id: "param-id",
          name: "id",
          required: true,
          description: "Record identifier",
        },
      ],
    },
    blocks: [
      defaultRecordBlock("record-detail", "records", "url.id"),
      {
        ...defaultListBlock("audit-log", "audit_logs"),
        position: { x: 0, y: 1, width: 6, height: 4 },
        filters: [
          {
            id: "audit-filter",
            column: "record_id",
            operator: "equals",
            value: "url.id",
          },
        ],
      },
      {
        ...defaultListBlock("workflow-runs", "workflow_runs"),
        position: { x: 6, y: 1, width: 6, height: 4 },
        filters: [
          {
            id: "runs-filter",
            column: "record_id",
            operator: "equals",
            value: "url.id",
          },
        ],
      },
    ],
  },
  {
    id: "list-view",
    name: "List view",
    description: "Single, full-width table for browsing a dataset.",
    preview: [{ columns: [{ span: 12, label: "Table", variant: "list" }] }],
    blocks: [
      defaultListBlock("primary-list", "records"),
    ],
  },
  {
    id: "action-dashboard",
    name: "Action dashboard",
    description:
      "List of workflow runs with a trigger panel for quick actions.",
    preview: [
      {
        columns: [
          { span: 8, label: "Runs", variant: "list" },
          { span: 4, label: "Trigger", variant: "trigger" },
        ],
      },
    ],
    blocks: [
      {
        ...defaultListBlock("runs", "workflow_runs"),
        position: { x: 0, y: 0, width: 8, height: 6 },
      },
      {
        id: "trigger-panel",
        type: "trigger",
        position: { x: 8, y: 0, width: 4, height: 6 },
        display: {
          buttonText: "Run workflow",
          actionType: "primary",
          requireConfirmation: false,
          confirmationText: "",
          hookName: "run_workflow",
        },
      },
    ],
  },
  {
    id: "master-detail",
    name: "Master-detail",
    description:
      "Left column list for browsing, right column record details for the selection.",
    preview: [
      {
        columns: [
          { span: 5, label: "List", variant: "list" },
          { span: 7, label: "Record", variant: "record" },
        ],
      },
    ],
    settings: {
      urlParams: [
        {
          id: "param-master-id",
          name: "id",
          required: true,
          description: "Record identifier",
        },
      ],
    },
    blocks: [
      {
        ...defaultListBlock("master-list", "records"),
        position: { x: 0, y: 0, width: 5, height: 8 },
      },
      {
        ...defaultRecordBlock("detail-panel", "records", "url.id"),
        position: { x: 5, y: 0, width: 7, height: 8 },
      },
    ],
  },
  {
    id: "reporting",
    name: "Reporting overview",
    description: "Combination of KPIs, chart, and recent activity feed.",
    preview: [
      {
        columns: [
          { span: 4, label: "Report", variant: "report" },
          { span: 4, label: "Report", variant: "report" },
          { span: 4, label: "Report", variant: "report" },
        ],
      },
      {
        columns: [
          { span: 8, label: "Chart", variant: "report" },
          { span: 4, label: "List", variant: "list" },
        ],
      },
    ],
    blocks: [
      {
        ...defaultListBlock("kpi-one", "metrics"),
        id: "kpi-one",
        position: { x: 0, y: 0, width: 4, height: 2 },
      },
      {
        ...defaultListBlock("kpi-two", "metrics"),
        id: "kpi-two",
        position: { x: 4, y: 0, width: 4, height: 2 },
      },
      {
        ...defaultListBlock("kpi-three", "metrics"),
        id: "kpi-three",
        position: { x: 8, y: 0, width: 4, height: 2 },
      },
      {
        id: "report-chart",
        type: "report",
        position: { x: 0, y: 2, width: 8, height: 6 },
        reportId: "report-1",
        display: {
          chartType: "line",
          title: "Performance",
        },
      },
      {
        ...defaultListBlock("recent-activity", "activity_log"),
        position: { x: 8, y: 2, width: 4, height: 6 },
      },
    ],
  },
];

