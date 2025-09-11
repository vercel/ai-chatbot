import { IntentData, LeadValidationResult } from "./types";
import { normalizePhoneBR, normalizeEmail, extractUF } from "./normalize";

function calculateConfidence(hasName: boolean, hasContact: boolean, hasAddress: boolean, hasSupportedRegion: boolean, bothContacts: boolean): number {
  let confidence = 0;
  if (hasName) confidence += 0.3;
  if (hasContact) {
    confidence += 0.3;
    if (bothContacts) confidence += 0.1;
  }
  if (hasAddress) confidence += 0.2;
  if (hasSupportedRegion) confidence += 0.2;
  return Math.min(confidence, 1);
}

function getValidationReasons(hasName: boolean, hasContact: boolean, hasAddress: boolean, hasSupportedRegion: boolean): string[] {
  const reasons: string[] = [];
  if (!hasName) reasons.push("Nome é obrigatório");
  if (!hasContact) reasons.push("Telefone ou e-mail é obrigatório");
  if (!hasAddress) reasons.push("Endereço detalhado é necessário para análise de viabilidade");
  if (!hasSupportedRegion) reasons.push("Atualmente atendemos apenas SP, RJ, MG, PR, SC e RS");
  return reasons;
}

function getNextActions(status: "approved" | "incomplete" | "unsupported_region") {
  const primaryCta = status === "approved"
    ? { label: "Iniciar Análise de Viabilidade", href: "/journey/investigation" }
    : { label: "Completar Cadastro", href: "#contact-form" };

  const secondaryCta = status === "approved"
    ? { label: "Ver Planos Disponíveis", href: "/plans" }
    : undefined;

  return { primaryCta, secondaryCta };
}

/**
 * Validates lead data and returns structured result
 * @param data Intent data from user
 * @returns Validation result with status and recommendations
 */
export function validateLead(data: IntentData): LeadValidationResult {
  // Normalize data
  const normalizedPhone = normalizePhoneBR(data.phone || "");
  const normalizedEmail = normalizeEmail(data.email || "");
  const extractedUF = extractUF(data.address || "");

  // Check completeness
  const hasName = Boolean(data.name && data.name.length >= 2);
  const hasContact = Boolean(normalizedPhone || normalizedEmail);
  const hasAddress = Boolean(data.address && data.address.length > 10);
  const hasSupportedRegion = extractedUF !== undefined;
  const bothContacts = Boolean(normalizedPhone && normalizedEmail);

  // Build reasons and confidence
  const reasons = getValidationReasons(hasName, hasContact, hasAddress, hasSupportedRegion);
  const confidence = calculateConfidence(hasName, hasContact, hasAddress, hasSupportedRegion, bothContacts);

  // Determine status
  let status: "approved" | "incomplete" | "unsupported_region" = "incomplete";
  if (!hasSupportedRegion) {
    status = "unsupported_region";
  } else if (hasName && hasContact && hasAddress) {
    status = "approved";
  }

  const next = getNextActions(status);

  return {
    isValidLead: status === "approved",
    status,
    reasons,
    normalized: {
      phone: normalizedPhone,
      email: normalizedEmail,
      address: data.address,
      uf: extractedUF,
    },
    next,
    confidence,
  };
}

