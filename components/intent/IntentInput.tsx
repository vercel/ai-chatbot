"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IntentData, IntentDataSchema, LeadValidationResult } from "@/lib/lead/types";
import { validateLeadAction } from "@/app/actions/validateLeadAction";

export type FieldConfig = {
  name: keyof IntentData;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  options?: { label: string; value: string }[];
};

export type IntentInputProps = {
  fields?: FieldConfig[];
  layout?: "compact" | "wide";
  defaultValues?: Partial<IntentData>;
  onValidated?: (result: LeadValidationResult) => void;
  submitMode?: "serverAction" | "api";
  className?: string;
};

const DEFAULT_FIELDS: FieldConfig[] = [
  { name: "name", label: "Nome", placeholder: "Seu nome", required: true, type: "text" },
  { name: "email", label: "E-mail", placeholder: "voce@exemplo.com", type: "email" },
  { name: "phone", label: "Telefone", placeholder: "(11) 91234-5678", type: "tel" },
  { name: "address", label: "Endereço", placeholder: "Rua, número, cidade - UF", type: "text" },
  {
    name: "persona",
    label: "Persona",
    type: "select",
    options: [
      { label: "Proprietário(a)", value: "owner" },
      { label: "Integrador(a)", value: "integrator" },
    ],
  },
  {
    name: "goal",
    label: "Objetivo",
    type: "select",
    options: [
      { label: "Viabilidade", value: "viability" },
      { label: "Orçamento", value: "quote" },
      { label: "Suporte", value: "support" },
      { label: "Outro", value: "other" },
    ],
  },
  { name: "notes", label: "Notas", placeholder: "Detalhes adicionais", type: "textarea" },
];

/**
 * Generic, parametric intent input form component.
 */
export default function IntentInput({
  fields = DEFAULT_FIELDS,
  layout = "compact",
  defaultValues,
  onValidated,
  submitMode = "serverAction",
  className,
}: IntentInputProps) {
  const [result, setResult] = useState<LeadValidationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const gridCols = layout === "wide" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

  const form = useForm<IntentData>({
    resolver: zodResolver(IntentDataSchema),
    defaultValues: {
      persona: "owner",
      goal: "viability",
      ...defaultValues,
    },
    mode: "onBlur",
  });

  const onSubmit = useCallback(
    (values: IntentData) => {
      startTransition(async () => {
        try {
          let validated: LeadValidationResult;
          if (submitMode === "serverAction") {
            validated = await validateLeadAction(values);
          } else {
            const res = await fetch("/api/lead/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            validated = (await res.json()) as LeadValidationResult;
          }
          setResult(validated);
          onValidated?.(validated);
        } catch (err) {
          // Non-invasive error capture
          console.error("Validation error", err);
        }
      });
    },
    [onValidated, submitMode]
  );

  const renderField = useCallback(
    (cfg: FieldConfig) => {
      const id = `intent-${cfg.name}`;
      const error = (form.formState.errors as any)?.[cfg.name]?.message as string | undefined;
      const commonProps = {
        id,
        className:
          "w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus:outline-none focus-yello",
        "aria-invalid": Boolean(error) || undefined,
        "aria-describedby": error ? `${id}-error` : undefined,
        placeholder: cfg.placeholder,
        ...form.register(cfg.name as any),
      } as const;

      if (cfg.type === "textarea") {
        return (
          <div key={cfg.name} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {cfg.label}
            </label>
            <textarea {...(commonProps as any)} rows={4} />
            {error && (
              <span id={`${id}-error`} role="alert" className="text-xs text-amber-600">
                {error}
              </span>
            )}
          </div>
        );
      }

      if (cfg.type === "select") {
        return (
          <div key={cfg.name} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {cfg.label}
            </label>
            <select id={id} className={commonProps.className} {...(form.register(cfg.name as any) as any)}>
              {(cfg.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {error && (
              <span id={`${id}-error`} role="alert" className="text-xs text-amber-600">
                {error}
              </span>
            )}
          </div>
        );
      }

      return (
        <div key={cfg.name} className="flex flex-col gap-1">
          <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            {cfg.label}
          </label>
          <input
            type={cfg.type || "text"}
            {...(commonProps as any)}
          />
          {error && (
            <span id={`${id}-error`} role="alert" className="text-xs text-amber-600">
              {error}
            </span>
          )}
        </div>
      );
    },
    [form]
  );

  const submitDisabled = isPending || form.formState.isSubmitting;

  return (
    <div className={"rounded-xl border yello-stroke p-4 glass " + (className || "")}>
      <form
        id="intent-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        aria-labelledby="intent-form-title"
      >
        <h2 id="intent-form-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Dados de Intenção
        </h2>

        <div className={`grid gap-4 ${gridCols}`}>
          {fields.map(renderField)}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-yellow-300 focus-yello"
            disabled={submitDisabled}
          >
            {isPending ? "Validando..." : "Continuar"}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border yello-stroke bg-transparent px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-white/40 focus-yello"
            onClick={() => {
              form.reset();
              setResult(null);
            }}
          >
            Limpar
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6">
          {/* Consumers can render their own card; this section is only for the demo page. */}
        </div>
      )}
    </div>
  );
}

