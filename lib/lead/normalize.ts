/**
 * Normalization utilities for lead data
 */

/**
 * Normalizes Brazilian phone numbers to E.164 format
 * @param phone Raw phone string
 * @returns Normalized phone or undefined if invalid
 */
export function normalizePhoneBR(phone: string): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // Must have 10 or 11 digits (area code + number)
  if (digits.length < 10 || digits.length > 11) return undefined;

  // Brazilian mobile numbers start with 9 (11 digits total)
  if (digits.length === 11 && !digits.startsWith("9")) return undefined;

  // Add country code if missing
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;

  // Format as +55 XX XXXXX-XXXX or +55 XX XXXX-XXXX
  if (withCountry.length === 13) {
    return `+${withCountry.slice(0, 2)} ${withCountry.slice(2, 4)} ${withCountry.slice(4, 9)}-${withCountry.slice(9)}`;
  }

  return undefined;
}

/**
 * Normalizes email addresses (lowercase, trim)
 * @param email Raw email string
 * @returns Normalized email or undefined if invalid
 */
export function normalizeEmail(email: string): string | undefined {
  if (!email) return undefined;

  const normalized = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized) ? normalized : undefined;
}

/**
 * Extracts UF (state) from Brazilian address
 * @param address Raw address string
 * @returns UF code or undefined
 */
export function extractUF(address: string): string | undefined {
  if (!address) return undefined;

  // Supported states for solar energy focus
  const supportedStates = ["SP", "RJ", "MG", "PR", "SC", "RS"];

  // Look for UF patterns in address
  const ufPatterns = [
    /\b(SP|RJ|MG|PR|SC|RS)\b/gi, // State codes
    /(são paulo|rio de janeiro|minas gerais|paraná|santa catarina|rio grande do sul)/gi, // Full names
  ];

  for (const pattern of ufPatterns) {
    const match = pattern.exec(address);
    if (match) {
      const found = match[0].toUpperCase();
      // Convert full names to codes
      const stateMap: Record<string, string> = {
        "SÃO PAULO": "SP",
        "RIO DE JANEIRO": "RJ",
        "MINAS GERAIS": "MG",
        "PARANÁ": "PR",
        "SANTA CATARINA": "SC",
        "RIO GRANDE DO SUL": "RS",
      };

      const code = stateMap[found] || found;
      return supportedStates.includes(code) ? code : undefined;
    }
  }

  return undefined;
}

