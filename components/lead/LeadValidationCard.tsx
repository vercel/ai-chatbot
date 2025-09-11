"use client";

import React from "react";
import { LeadValidationResult } from "@/lib/lead/types";

export type LeadValidationCardProps = {
  result: LeadValidationResult;
  className?: string;
};

function StatusIcon({ status }: { status: LeadValidationResult["status"] }) {
  const color =
    status === "approved" ? "text-emerald-600" : status === "incomplete" ? "text-amber-600" : "text-red-600";
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={color}
    >
      {status === "approved" && (
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {status === "incomplete" && (
        <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {status === "unsupported_region" && (
        <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function statusLabel(status: LeadValidationResult["status"]): string {
  switch (status) {
    case "approved":
      return "Aprovado";
    case "incomplete":
      return "Incompleto";
    case "unsupported_region":
      return "Fora de cobertura";
  }
}

/** Visual card to present the lead validation result */
export default function LeadValidationCard({ result, className }: LeadValidationCardProps) {
  return (
    <section
      className={
        "rounded-xl border yello-stroke p-4 glass text-sm text-zinc-900 dark:text-zinc-100 " + (className || "")
      }
      aria-labelledby="lead-validation-title"
    >
      <div className="flex items-center gap-2">
        <StatusIcon status={result.status} />
        <h3 id="lead-validation-title" className="text-base font-semibold">
          Validação de Lead
        </h3>
      </div>

      <div className="mt-3 flex items-center gap-2" data-testid="lead-status">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Status:</span>
        <span className="font-medium">{statusLabel(result.status)}</span>
      </div>

      {result.reasons.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Razões</h4>
          <ul className="list-disc pl-5">
            {result.reasons.map((r, i) => (
              <li key={i} className="mb-0.5" data-testid="reason-item">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <h4 className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Normalizações</h4>
        <dl className="grid grid-cols-1 gap-y-1 md:grid-cols-2">
          {result.normalized.email && (
            <>
              <dt className="text-xs text-zinc-500">E-mail</dt>
              <dd className="font-medium">{result.normalized.email}</dd>
            </>
          )}
          {result.normalized.phone && (
            <>
              <dt className="text-xs text-zinc-500">Telefone</dt>
              <dd className="font-medium">{result.normalized.phone}</dd>
            </>
          )}
          {result.normalized.address && (
            <>
              <dt className="text-xs text-zinc-500">Endereço</dt>
              <dd className="font-medium">{result.normalized.address}</dd>
            </>
          )}
          {result.normalized.uf && (
            <>
              <dt className="text-xs text-zinc-500">UF</dt>
              <dd className="font-medium">{result.normalized.uf}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="lead-ctas">
        <a
          className="inline-flex items-center rounded-md bg-yellow-400 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-yellow-300 focus-yello"
          href={result.next.primaryCta.href}
        >
          {result.next.primaryCta.label}
        </a>
        {result.next.secondaryCta && (
          <a
            className="inline-flex items-center rounded-md border yello-stroke px-3 py-1.5 text-sm font-medium hover:bg-white/40 focus-yello"
            href={result.next.secondaryCta.href}
          >
            {result.next.secondaryCta.label}
          </a>
        )}
      </div>
    </section>
  );
}

