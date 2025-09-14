/**
 * Domain-specific errors for the Omni layer
 */
export class OmniValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'OmniValidationError';
  }
}

export class OmniBusError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'OmniBusError';
  }
}

/** Build a concise error message from a ZodError-like object */
export function summarizeZodError(e: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = e as any;
  if (err?.issues && Array.isArray(err.issues)) {
    return err.issues
      .map((i: { path?: (string | number)[]; message?: string }) =>
        `${(i.path || []).join('.')} ${i.message || ''}`.trim(),
      )
      .join('; ');
  }
  return (err?.message as string) || 'invalid payload';
}

