/**
 * Generate a URL-safe slug from a string.
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove all characters except alphanumeric and hyphens
    .replace(/[^a-z0-9-]/g, "")
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalize a slug to ensure it's valid.
 * Removes invalid characters and ensures proper formatting.
 */
export function normalizeSlug(slug: string): string {
  return generateSlug(slug);
}


