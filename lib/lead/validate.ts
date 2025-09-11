import { IntentData, LeadValidationResult } from "./types";
import { extractUF, normalizeEmail, normalizePhoneBR } from "./normalize";

const SUPPORTED_UF = new Set(["SP", "RJ", "MG", "PR", "SC", "RS"]);

/** Basic email regex for deterministic validation (business-level). */
const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/** Compute a simple completeness-based confidence score (0..1). */
function computeConfidence(data: IntentData, normalized: { phone?: string; email?: string; address?: string }): number {
  let score = 0;
  let total = 6; // name, persona, goal, email, phone, address
  if (data.name && data.name.trim().length >= 2) score += 1;
  if (data.persona) score += 1;
  if (data.goal) score += 1;
  if (normalized.email) score += 1;
  if (normalized.phone) score += 1;
  if (normalized.address) score += 1;
  return Math.max(0, Math.min(1, score / total));
}

/**
 * Deterministic lead validation.
 * - Normalizes phone and email.
 * - Validates email format (simple regex) and phone feasibility.
 * - Extracts UF from address and checks supported region.
 * - Enforces minimal rule: address present OR (email + phone) present.
 */
export function validateLead(data: IntentData): LeadValidationResult {
  const reasons: string[] = [];

  const normalizedEmail = normalizeEmail(data.email);
  const normalizedPhone = normalizePhoneBR(data.phone);
  const trimmedAddress = data.address?.trim() || undefined;
  const uf = extractUF(trimmedAddress);

  // Email validation (if provided)
  if (data.email && (!normalizedEmail || !SIMPLE_EMAIL_RE.test(normalizedEmail))) {
    reasons.push("E-mail inválido");
  }

  // Phone validation (if provided)
  if (data.phone && !normalizedPhone) {
    reasons.push("Telefone inválido ou não reconhecido");
  }

  // Minimal rule: address present OR (email + phone) present
  const hasAddress = Boolean(trimmedAddress);
  const hasEmailAndPhone = Boolean(normalizedEmail && normalizedPhone);
  if (!hasAddress && !hasEmailAndPhone) {
    reasons.push("Informe endereço ou e-mail e telefone");
  }

  // Region support check
  let status: LeadValidationResult["status"] = "approved";
  if (uf && !SUPPORTED_UF.has(uf)) {
    status = "unsupported_region";
    reasons.push(`Região não suportada: ${uf}`);
  } else if (reasons.length > 0) {
    status = "incomplete";
  }

  const normalized = {
    phone: normalizedPhone,
    email: normalizedEmail,
    address: trimmedAddress,
    uf,
  };

  const confidence = computeConfidence(data, normalized);

  const isValidLead = status === "approved";

  const next =
    status === "approved"
      ? {
          primaryCta: { label: "Prosseguir para Análise", href: "/journey/analysis" },
          secondaryCta: { label: "Voltar para Jornada", href: "/journey" },
        }
      : status === "unsupported_region"
      ? {
          primaryCta: { label: "Falar com Atendimento", href: "/support" },
          secondaryCta: { label: "Voltar para Jornada", href: "/journey" },
        }
      : {
          primaryCta: { label: "Corrigir informações", href: "#intent-form" },
          secondaryCta: { label: "Voltar para Jornada", href: "/journey" },
        };

  return {
    isValidLead,
    status,
    reasons,
    normalized,
    next,
    confidence,
  };
}

export default validateLead;

