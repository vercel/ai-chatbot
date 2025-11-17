"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { PageRecord } from "@/lib/server/pages";
import {
  Button,
  buttonVariants,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createBlockDraft,
  draftToSavePayload,
  pageRecordToDraft,
} from "../transformers";
import type {
  ListBlockDraft,
  ListBlockFilter,
  ListFilterOperator,
  PageBlockDraft,
  PageDraft,
  PageSavePayload,
  PageUrlParamDraft,
  RecordBlockDraft,
  ReportBlockDraft,
  TriggerBlockDraft,
} from "../types";
import {
  LIST_DISPLAY_FORMATS,
  LIST_FILTER_OPERATORS,
  RECORD_DISPLAY_FORMATS,
  RECORD_DISPLAY_MODES,
  REPORT_CHART_TYPES,
  TRIGGER_ACTION_TYPES,
} from "../types";
import { pageTemplates, type PageTemplate } from "../templates";

export type PageBuilderProps = {
  initialPage: PageRecord;
  onSave: (payload: PageSavePayload) => Promise<void> | void;
  onReset?: () => void;
  isSaving?: boolean;
};

export function PageBuilder({
  initialPage,
  onSave,
  onReset,
  isSaving = false,
}: PageBuilderProps) {
  const [draft, setDraft] = useState<PageDraft>(() =>
    pageRecordToDraft(initialPage)
  );
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setDraft(pageRecordToDraft(initialPage));
  }, [initialPage]);

  useEffect(() => {
    setSaving(isSaving);
  }, [isSaving]);

  const handleReset = () => {
    setDraft(pageRecordToDraft(initialPage));
    onReset?.();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = draftToSavePayload(draft);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (template: PageTemplate) => {
    if (
      draft.blocks.length > 0 &&
      template.id !== selectedTemplateId &&
      typeof window !== "undefined"
    ) {
      const confirmed = window.confirm(
        "Applying a template will replace the current blocks. Continue?"
      );
      if (!confirmed) {
        return;
      }
    }

    setDraft((current) => ({
      ...current,
      blocks: template.blocks.map((block) => ({
        ...block,
        id: `${block.id}-${nanoid(6)}`,
      })),
      settings: {
        ...current.settings,
        ...template.settings,
        urlParams:
          template.settings?.urlParams?.map((param) => ({
            ...param,
            id: param.id ?? nanoid(6),
          })) ?? current.settings.urlParams,
      },
    }));
    setSelectedTemplateId(template.id);
  };

  const handleUpdateBlock = (blockId: string, update: PageBlockDraft) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? { ...update } : block
      ),
    }));
  };

  const handleRemoveBlock = (blockId: string) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  };

  const handleUpdateParam = (paramId: string, update: Partial<PageUrlParamDraft>) => {
    setDraft((current) => ({
      ...current,
      settings: {
        ...current.settings,
        urlParams: current.settings.urlParams.map((param) =>
          param.id === paramId ? { ...param, ...update } : param
        ),
      },
    }));
  };

  const handleAddParam = () => {
    setDraft((current) => ({
      ...current,
      settings: {
        ...current.settings,
        urlParams: [
          ...current.settings.urlParams,
          {
            id: nanoid(8),
            name: "",
            required: false,
            description: "",
          },
        ],
      },
    }));
  };

  const handleRemoveParam = (paramId: string) => {
    setDraft((current) => ({
      ...current,
      settings: {
        ...current.settings,
        urlParams: current.settings.urlParams.filter(
          (param) => param.id !== paramId
        ),
      },
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Page settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure the slug, metadata, and top-level options for this page.
            </p>
          </div>
          <div className="flex gap-3">
            {onReset ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field>
            <Label htmlFor="page-slug">Slug / route</Label>
            <Input
              id="page-slug"
              value={draft.id}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  id: normalizeSlug(event.target.value),
                }))
              }
              placeholder="workflows"
              autoCapitalize="none"
            />
            <p className="text-xs text-muted-foreground">
              URL: /pages/
              <span className="font-mono text-foreground">{draft.id}</span>
            </p>
          </Field>
          <Field>
            <Label htmlFor="page-name">Name</Label>
            <Input
              id="page-name"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Customer detail"
            />
          </Field>
          <Field>
            <Label htmlFor="page-description">Description</Label>
            <Input
              id="page-description"
              value={draft.description ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional summary shown in headers"
            />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md border border-border/70 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Show page header
            </p>
            <p className="text-xs text-muted-foreground">
              Toggle the title and description section for viewers.
            </p>
          </div>
          <CheckboxField
            id="page-header"
            label=""
            checked={!draft.settings.hideHeader}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                settings: {
                  ...current.settings,
                  hideHeader: !checked,
                },
              }))
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            Choose a template
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a layout template to scaffold blocks. You can still edit
            tables, filters, and text after applying a template.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pageTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplateId === template.id}
              onApply={() => handleApplyTemplate(template)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              URL parameters
            </h3>
            <p className="text-sm text-muted-foreground">
              Document the query parameters the page expects. Each parameter can
              be referenced by blocks using <code>url.paramName</code>.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleAddParam}>
            Add parameter
          </Button>
        </header>

        <div className="mt-4 flex flex-col gap-4">
          {draft.settings.urlParams.length === 0 ? (
            <EmptyState message="No URL parameters configured yet." />
          ) : (
            draft.settings.urlParams.map((param) => (
              <div
                key={param.id}
                className="rounded-md border border-dashed border-border/80 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto] md:items-end">
                  <Field>
                    <Label htmlFor={`url-param-${param.id}`}>Name</Label>
                    <Input
                      id={`url-param-${param.id}`}
                      value={param.name}
                      onChange={(event) =>
                        handleUpdateParam(param.id, {
                          name: event.target.value,
                        })
                      }
                      placeholder="customerId"
                    />
                  </Field>
                  <div className="flex items-center gap-3">
                    <CheckboxField
                      id={`url-param-required-${param.id}`}
                      label="Required"
                      checked={param.required}
                      onChange={(checked) =>
                        handleUpdateParam(param.id, {
                          required: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-red-500 hover:text-red-500"
                      )}
                      onClick={() => handleRemoveParam(param.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <Field className="mt-3">
                  <Label htmlFor={`url-param-description-${param.id}`}>
                    Description
                  </Label>
                  <Input
                    id={`url-param-description-${param.id}`}
                    value={param.description ?? ""}
                    onChange={(event) =>
                      handleUpdateParam(param.id, {
                        description: event.target.value,
                      })
                    }
                    placeholder="Used to resolve selected record"
                  />
                </Field>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Blocks</h3>
            <p className="text-sm text-muted-foreground">
              Adjust data sources and filters. Layout is controlled by the
              template.
            </p>
          </div>
        </header>

        <div className="mt-4 flex flex-col gap-5">
          {draft.blocks.length === 0 ? (
            <EmptyState message="No blocks added yet. Add a block to get started." />
          ) : (
            draft.blocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={(updated) => handleUpdateBlock(block.id, updated)}
                onRemove={() => handleRemoveBlock(block.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

type TemplateCardProps = {
  template: PageTemplate;
  selected: boolean;
  onApply: () => void;
};

function TemplateCard({ template, selected, onApply }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:bg-muted/40"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {template.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {template.description}
          </p>
        </div>
        {selected ? (
          <span className="text-xs font-medium text-primary">Selected</span>
        ) : (
          <span className="text-xs text-muted-foreground">Apply</span>
        )}
      </div>
      <TemplatePreview rows={template.preview} />
    </button>
  );
}

type TemplatePreviewProps = {
  rows: PageTemplate["preview"];
};

function TemplatePreview({ rows }: TemplatePreviewProps) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/80 p-3">
      <div className="rounded-md border border-border/70 bg-background px-3 pb-4 pt-2 shadow-inner">
        <div className="mb-2 flex gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex gap-2">
              {row.columns.map((column, columnIndex) => (
                <div
                  key={`col-${columnIndex}`}
                  className={cn(
                    "rounded-sm px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-background",
                    column.variant === "record"
                      ? "bg-blue-500/80"
                      : column.variant === "list"
                        ? "bg-emerald-500/80"
                        : column.variant === "trigger"
                          ? "bg-orange-500/80"
                          : "bg-purple-500/70"
                  )}
                  style={{ flex: column.span }}
                >
                  {column.label ?? column.variant ?? "Block"}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type BlockEditorProps = {
  block: PageBlockDraft;
  onChange: (block: PageBlockDraft) => void;
  onRemove: () => void;
};

function BlockEditor({ block, onChange, onRemove }: BlockEditorProps) {
  const typeLabel = block.type.charAt(0).toUpperCase() + block.type.slice(1);

  return (
    <article className="rounded-lg border border-border/60 bg-muted/10 p-5 shadow-sm">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <Field className="md:max-w-xs">
            <Label htmlFor={`block-id-${block.id}`}>Block ID</Label>
            <Input
              id={`block-id-${block.id}`}
              value={block.id}
              onChange={(event) =>
                onChange({
                  ...block,
                  id: event.target.value,
                })
              }
            />
          </Field>
          <div className="rounded-md border border-border/70 px-3 py-2 text-sm font-medium text-muted-foreground">
            {typeLabel} block
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="self-start text-red-500 hover:text-red-500"
          onClick={onRemove}
        >
          Remove {typeLabel} block
        </Button>
      </header>

      <div className="mt-6">
        {block.type === "list" ? (
          <ListBlockForm block={block} onChange={onChange} />
        ) : null}
        {block.type === "record" ? (
          <RecordBlockForm block={block} onChange={onChange} />
        ) : null}
        {block.type === "report" ? (
          <ReportBlockForm block={block} onChange={onChange} />
        ) : null}
        {block.type === "trigger" ? (
          <TriggerBlockForm block={block} onChange={onChange} />
        ) : null}
      </div>
    </article>
  );
}

function ListBlockForm({
  block,
  onChange,
}: {
  block: ListBlockDraft;
  onChange: (block: ListBlockDraft) => void;
}) {
  const update = (updates: Partial<ListBlockDraft>) => {
    onChange({
      ...block,
      ...updates,
    });
  };

  const updateDisplay = (
    updates: Partial<ListBlockDraft["display"]>
  ) => {
    update({
      display: {
        ...block.display,
        ...updates,
      },
    });
  };

  const filters = useMemo(() => block.filters ?? [], [block.filters]);

  const handleFilterUpdate = (
    filterId: string,
    updates: Partial<ListBlockFilter>
  ) => {
    update({
      filters: filters.map((filter) =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      ),
    });
  };

  const handleAddFilter = () => {
    update({
      filters: [
        ...filters,
        {
          id: nanoid(10),
          column: "",
          operator: "equals",
          value: "",
        },
      ],
    });
  };

  const handleRemoveFilter = (filterId: string) => {
    update({
      filters: filters.filter((filter) => filter.id !== filterId),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <h4 className="text-base font-semibold text-foreground">
        List configuration
      </h4>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor={`list-table-${block.id}`}>Table</Label>
          <Input
            id={`list-table-${block.id}`}
            value={block.tableName}
            onChange={(event) =>
              update({ tableName: event.target.value })
            }
            placeholder="customers"
          />
        </Field>
        <Field>
          <Label htmlFor={`list-format-${block.id}`}>Display format</Label>
          <Select
            value={block.display.format}
            onValueChange={(value) =>
              updateDisplay({
                format: value as ListBlockDraft["display"]["format"],
              })
            }
          >
            <SelectTrigger id={`list-format-${block.id}`}>
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {LIST_DISPLAY_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <CheckboxField
          id={`list-actions-${block.id}`}
          label="Show row actions"
          checked={block.display.showActions}
          onChange={(checked) =>
            updateDisplay({ showActions: checked })
          }
        />
        <CheckboxField
          id={`list-editable-${block.id}`}
          label="Inline editable"
          checked={block.display.editable}
          onChange={(checked) =>
            updateDisplay({ editable: checked })
          }
        />
        <Field>
          <Label htmlFor={`list-columns-${block.id}`}>Visible columns</Label>
          <Input
            id={`list-columns-${block.id}`}
            value={block.display.columns.join(", ")}
            onChange={(event) =>
              updateDisplay({
                columns: event.target.value
                  .split(",")
                  .map((column) => column.trim())
                  .filter(Boolean),
              })
            }
            placeholder="id, email, status"
          />
        </Field>
      </div>

      <div>
        <header className="flex items-center justify-between">
          <h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </h5>
          <Button type="button" variant="outline" onClick={handleAddFilter}>
            Add filter
          </Button>
        </header>
        <div className="mt-3 flex flex-col gap-3">
          {filters.length === 0 ? (
            <EmptyState message="No filters applied." />
          ) : (
            filters.map((filter) => (
              <div
                key={filter.id}
                className="grid gap-3 rounded-md border border-border/70 p-3 md:grid-cols-[1fr,1fr,1fr,auto]"
              >
                <Field>
                  <Label htmlFor={`filter-column-${filter.id}`}>Column</Label>
                  <Input
                    id={`filter-column-${filter.id}`}
                    value={filter.column}
                    onChange={(event) =>
                      handleFilterUpdate(filter.id, {
                        column: event.target.value,
                      })
                    }
                    placeholder="customer_id"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`filter-operator-${filter.id}`}>
                    Operator
                  </Label>
                  <Select
                    value={filter.operator}
                    onValueChange={(value) =>
                      handleFilterUpdate(filter.id, {
                        operator: value as ListFilterOperator,
                      })
                    }
                  >
                    <SelectTrigger id={`filter-operator-${filter.id}`}>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {LIST_FILTER_OPERATORS.map((operator) => (
                        <SelectItem key={operator} value={operator}>
                          {operator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor={`filter-value-${filter.id}`}>Value</Label>
                  <Input
                    id={`filter-value-${filter.id}`}
                    value={filter.value}
                    onChange={(event) =>
                      handleFilterUpdate(filter.id, {
                        value: event.target.value,
                      })
                    }
                    placeholder="url.customerId"
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  className="self-end text-red-500 hover:text-red-500"
                  onClick={() => handleRemoveFilter(filter.id)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RecordBlockForm({
  block,
  onChange,
}: {
  block: RecordBlockDraft;
  onChange: (block: RecordBlockDraft) => void;
}) {
  const update = (updates: Partial<RecordBlockDraft>) => {
    onChange({
      ...block,
      ...updates,
    });
  };

  const updateDisplay = (
    updates: Partial<RecordBlockDraft["display"]>
  ) => {
    update({
      display: {
        ...block.display,
        ...updates,
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <h4 className="text-base font-semibold text-foreground">
        Record configuration
      </h4>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor={`record-table-${block.id}`}>Table</Label>
          <Input
            id={`record-table-${block.id}`}
            value={block.tableName}
            onChange={(event) =>
              update({ tableName: event.target.value })
            }
            placeholder="customers"
          />
        </Field>
        <Field>
          <Label htmlFor={`record-id-${block.id}`}>Record ID</Label>
          <Input
            id={`record-id-${block.id}`}
            value={block.recordId}
            onChange={(event) =>
              update({ recordId: event.target.value })
            }
            placeholder="url.customerId"
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <Label htmlFor={`record-mode-${block.id}`}>Mode</Label>
          <Select
            value={block.display.mode}
            onValueChange={(value) =>
              updateDisplay({
                mode: value as RecordBlockDraft["display"]["mode"],
              })
            }
          >
            <SelectTrigger id={`record-mode-${block.id}`}>
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              {RECORD_DISPLAY_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <Label htmlFor={`record-format-${block.id}`}>Display</Label>
          <Select
            value={block.display.format}
            onValueChange={(value) =>
              updateDisplay({
                format: value as RecordBlockDraft["display"]["format"],
              })
            }
          >
            <SelectTrigger id={`record-format-${block.id}`}>
              <SelectValue placeholder="Display" />
            </SelectTrigger>
            <SelectContent>
              {RECORD_DISPLAY_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="md:col-span-1">
          <Label htmlFor={`record-columns-${block.id}`}>Columns</Label>
          <Input
            id={`record-columns-${block.id}`}
            value={block.display.columns.join(", ")}
            onChange={(event) =>
              updateDisplay({
                columns: event.target.value
                  .split(",")
                  .map((column) => column.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Leave blank for all columns"
          />
        </Field>
      </div>
    </div>
  );
}

function ReportBlockForm({
  block,
  onChange,
}: {
  block: ReportBlockDraft;
  onChange: (block: ReportBlockDraft) => void;
}) {
  const update = (updates: Partial<ReportBlockDraft>) => {
    onChange({
      ...block,
      ...updates,
    });
  };

  const updateDisplay = (
    updates: Partial<ReportBlockDraft["display"]>
  ) => {
    update({
      display: {
        ...block.display,
        ...updates,
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <h4 className="text-base font-semibold text-foreground">
        Report configuration
      </h4>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor={`report-id-${block.id}`}>Report ID</Label>
          <Input
            id={`report-id-${block.id}`}
            value={block.reportId}
            onChange={(event) =>
              update({ reportId: event.target.value })
            }
            placeholder="report-uuid"
          />
        </Field>
        <Field>
          <Label htmlFor={`report-chart-${block.id}`}>Chart type</Label>
          <Select
            value={block.display.chartType}
            onValueChange={(value) =>
              updateDisplay({
                chartType: value as ReportBlockDraft["display"]["chartType"],
              })
            }
          >
            <SelectTrigger id={`report-chart-${block.id}`}>
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_CHART_TYPES.map((chart) => (
                <SelectItem key={chart} value={chart}>
                  {chart}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor={`report-title-${block.id}`}>Title</Label>
        <Input
          id={`report-title-${block.id}`}
          value={block.display.title}
          onChange={(event) =>
            updateDisplay({ title: event.target.value })
          }
          placeholder="Sales summary"
        />
      </Field>
    </div>
  );
}

function TriggerBlockForm({
  block,
  onChange,
}: {
  block: TriggerBlockDraft;
  onChange: (block: TriggerBlockDraft) => void;
}) {
  const updateDisplay = (
    updates: Partial<TriggerBlockDraft["display"]>
  ) => {
    onChange({
      ...block,
      display: {
        ...block.display,
        ...updates,
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <h4 className="text-base font-semibold text-foreground">
        Trigger configuration
      </h4>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor={`trigger-text-${block.id}`}>Button label</Label>
          <Input
            id={`trigger-text-${block.id}`}
            value={block.display.buttonText}
            onChange={(event) =>
              updateDisplay({ buttonText: event.target.value })
            }
            placeholder="Delete record"
          />
        </Field>
        <Field>
          <Label htmlFor={`trigger-action-${block.id}`}>Action style</Label>
          <Select
            value={block.display.actionType}
            onValueChange={(value) =>
              updateDisplay({
                actionType: value as TriggerBlockDraft["display"]["actionType"],
              })
            }
          >
            <SelectTrigger id={`trigger-action-${block.id}`}>
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_ACTION_TYPES.map((actionType) => (
                <SelectItem key={actionType} value={actionType}>
                  {actionType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <CheckboxField
        id={`trigger-confirmation-${block.id}`}
        label="Require confirmation"
        checked={block.display.requireConfirmation}
        onChange={(checked) =>
          updateDisplay({ requireConfirmation: checked })
        }
      />
      {block.display.requireConfirmation ? (
        <Field>
          <Label htmlFor={`trigger-confirm-${block.id}`}>
            Confirmation message
          </Label>
          <Textarea
            id={`trigger-confirm-${block.id}`}
            value={block.display.confirmationText}
            onChange={(event) =>
              updateDisplay({ confirmationText: event.target.value })
            }
            rows={3}
          />
        </Field>
      ) : null}
      <Field>
        <Label htmlFor={`trigger-hook-${block.id}`}>Hook name</Label>
        <Input
          id={`trigger-hook-${block.id}`}
          value={block.display.hookName}
          onChange={(event) =>
            updateDisplay({ hookName: event.target.value })
          }
          placeholder="delete_record"
        />
      </Field>
    </div>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border border-input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
    </div>
  );
}

function Field({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

