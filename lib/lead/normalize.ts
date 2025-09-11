/**
 * Normalize a Brazilian phone number to E.164-like format.
 * Tries to coerce local formats like (11) 91234-5678 or 011912345678 to +5511912345678.
 */
export function normalizePhoneBR(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return undefined;

  // Already includes country code 55
  if (digits.startsWith("55")) {
    const rest = digits.slice(2);
    if (rest.length >= 10 && rest.length <= 11) {
      return `+55${rest}`;
    }
    // If length unusual but starts with 55, still return as best effort
    return `+55${rest}`;
  }

  // Remove leading 0 (common for trunk prefix)
  const noZero = digits.replace(/^0+/, "");

  // If looks like AA + local (10 or 11 digits)
  if (noZero.length === 10 || noZero.length === 11) {
    return `+55${noZero}`;
  }

  // If user typed with leading +55 already (but removed by non-digit filter above)
  if (String(raw).trim().startsWith("+55")) {
    const rest = digits.replace(/^55/, "");
    return `+55${rest}`;
  }

  // Fallback: if we at least have 10+ digits, assume Brazil and prefix 55
  if (noZero.length >= 10) {
    return `+55${noZero}`;
  }

  return undefined;
}

/** Lowercase and trim email. */
export function normalizeEmail(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim().toLowerCase();
  return s || undefined;
}

/** Extract Brazilian UF (state) from an address string, if present. */
export function extractUF(address?: string | null): string | undefined {
  if (!address) return undefined;
  const text = String(address).toUpperCase();
  const UFs = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
  ];
  // Match whole word UF, considering separators and boundaries
  const match = text.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  if (match) {
    const uf = match[1] as string;
    if (UFs.includes(uf)) return uf;
  }
  return undefined;
}

