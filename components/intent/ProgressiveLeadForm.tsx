"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LeadValidationResult } from "@/lib/lead/types";
import { IntentDataSchema, type IntentData } from "@/lib/lead/types";
import { validateLeadAction } from "@/app/actions/validateLeadAction";

export interface ProgressiveLeadFormProps {
  defaultValues?: Partial<IntentData>;
  onValidated?: (result: LeadValidationResult) => void;
  className?: string;
}

const Step1Schema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.string().email("E-mail inválido").optional().or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .transform((v) => v?.replace(/\D/g, "") || "")
      .refine((v) => v.length === 0 || v.length >= 10, "Telefone inválido")
      .optional(),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), {
    message: "Informe e-mail ou telefone",
    path: ["email"],
  });

type Step1 = z.infer<typeof Step1Schema>;

const Step2Schema = IntentDataSchema.pick({ address: true, persona: true, goal: true, notes: true });
type Step2 = z.infer<typeof Step2Schema>;

function maskPhoneBR(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
}

export default function ProgressiveLeadForm({ defaultValues, onValidated, className }: ProgressiveLeadFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LeadValidationResult | null>(null);

  const form1 = useForm<Step1>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { name: "", email: "", phone: "", ...(defaultValues as any) },
    mode: "onBlur",
  });

  const form2 = useForm<Step2>({
    resolver: zodResolver(Step2Schema),
    defaultValues: { persona: "owner", goal: "viability", ...(defaultValues as any) },
    mode: "onBlur",
  });

  const canContinue = useMemo(() => {
    const { name, email, phone } = form1.getValues();
    const okName = (name || "").trim().length >= 2;
    const okContact = Boolean(email) || Boolean((phone || "").replace(/\D/g, "").length >= 10);
    return okName && okContact && Object.keys(form1.formState.errors).length === 0;
  }, [form1.watch(), form1.formState.errors]);

  const onSubmitAll = useCallback(() => {
    startTransition(async () => {
      try {
        const s1 = form1.getValues();
        const s2 = form2.getValues();
        const payload: IntentData = {
          name: s1.name,
          email: s1.email || undefined,
          phone: s1.phone || undefined,
          address: s2.address,
          persona: s2.persona,
          goal: s2.goal,
          notes: s2.notes,
        };
        const validated = await validateLeadAction(payload);
        setResult(validated);
        onValidated?.(validated);
      } catch (err) {
        console.error("Validation error", err);
      }
    });
  }, [form1, form2, onValidated]);

  return (
    <section className={"rounded-xl border yello-stroke p-4 glass " + (className || "")}> 
      <h2 className="text-base font-semibold mb-3">Seus dados</h2>

      {step === 1 && (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (canContinue) setStep(2); }}>
          <div className="flex flex-col gap-1">
            <label htmlFor="plf-name" className="text-sm font-medium">Nome</label>
            <input id="plf-name" {...form1.register("name")} className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello" />
            {form1.formState.errors.name && (
              <span role="alert" className="text-xs text-amber-600">{form1.formState.errors.name.message as string}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="plf-email" className="text-sm font-medium">E-mail</label>
              <input id="plf-email" type="email" {...form1.register("email")} className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello" />
              {form1.formState.errors.email && (
                <span role="alert" className="text-xs text-amber-600">{form1.formState.errors.email.message as string}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="plf-phone" className="text-sm font-medium">Telefone</label>
              <input
                id="plf-phone"
                type="tel"
                inputMode="tel"
                {...form1.register("phone")}
                onChange={(e) => {
                  const masked = maskPhoneBR(e.target.value);
                  form1.setValue("phone", masked, { shouldValidate: true, shouldDirty: true });
                }}
                className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello"
                placeholder="(11) 91234-5678"
              />
              {form1.formState.errors.phone && (
                <span role="alert" className="text-xs text-amber-600">{form1.formState.errors.phone.message as string}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button type="submit" disabled={!canContinue} className="inline-flex items-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50 hover:bg-yellow-300 focus-yello">
              Continuar
            </button>
            <span className="text-xs text-zinc-500">Etapa 1 de 2</span>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSubmitAll(); }}>
          <div className="flex flex-col gap-1">
            <label htmlFor="plf-address" className="text-sm font-medium">Endereço</label>
            <input id="plf-address" {...form2.register("address")} className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello" placeholder="Rua, número, cidade - UF" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="plf-persona" className="text-sm font-medium">Persona</label>
              <select id="plf-persona" className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello" {...form2.register("persona")}>
                <option value="owner">Proprietário(a)</option>
                <option value="integrator">Integrador(a)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="plf-goal" className="text-sm font-medium">Objetivo</label>
              <select id="plf-goal" className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello" {...form2.register("goal")}>
                <option value="viability">Viabilidade</option>
                <option value="quote">Orçamento</option>
                <option value="support">Suporte</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="plf-notes" className="text-sm font-medium">Notas</label>
            <textarea id="plf-notes" rows={4} {...form2.register("notes")} className="w-full rounded-md border yello-stroke bg-white/60 dark:bg-black/40 glass px-3 py-2 text-sm focus-yello" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center rounded-md border yello-stroke px-4 py-2 text-sm font-medium hover:bg-white/40 focus-yello">
              Voltar
            </button>
            <button type="submit" disabled={isPending} className="inline-flex items-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50 hover:bg-yellow-300 focus-yello">
              {isPending ? "Validando..." : "Concluir"}
            </button>
            <span className="text-xs text-zinc-500">Etapa 2 de 2</span>
          </div>
        </form>
      )}

      {result && (
        <div className="mt-4 text-xs text-zinc-500" aria-live="polite">
          Resultado recebido. Veja detalhes ao lado.
        </div>
      )}
    </section>
  );
}

