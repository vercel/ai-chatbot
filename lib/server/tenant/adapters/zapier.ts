import {
  type AdapterContext,
  type ResourceAdapter,
  type ResourceAdapterKind,
} from "./base";

export type ZapierInvocationOptions = {
  url?: string;
  event?: string;
  payload?: Record<string, unknown>;
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
};

export class ZapierResourceAdapter implements ResourceAdapter {
  readonly kind: ResourceAdapterKind = "zapier";

  constructor(private readonly context: AdapterContext) {}

  get workspaceId(): string {
    return this.context.workspaceId;
  }

  async initialize(): Promise<void> {
    // No initialization required for Zapier REST integration
  }

  async dispose(): Promise<void> {
    // Nothing to dispose
  }

  async invoke(options: ZapierInvocationOptions) {
    const targetUrl = options.url ?? this.resolveBaseUrl();
    if (!targetUrl) {
      throw new Error("Zapier webhook URL is not configured");
    }

    const apiKey = this.resolveApiKey();

    const response = await fetch(targetUrl, {
      method: options.method ?? "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        ...options.headers,
      },
      body: JSON.stringify({
        event: options.event ?? "zapier.webhook",
        payload: options.payload ?? {},
      }),
    });

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Zapier invocation failed with status ${response.status}: ${text}`
      );
    }

    return response.json().catch(() => undefined);
  }

  private resolveBaseUrl(): string | undefined {
    const metadata = this.context.configuration ?? {};
    return (
      (metadata.webhookUrl as string | undefined) ??
      (metadata.url as string | undefined) ??
      (metadata.endpoint as string | undefined)
    );
  }

  private resolveApiKey(): string | undefined {
    const metadata = this.context.configuration ?? {};
    const credentialRef = this.context.credentialRef;

    const metadataKey =
      (metadata.apiKey as string | undefined) ??
      (metadata.token as string | undefined);

    if (metadataKey) {
      return metadataKey;
    }

    if (credentialRef?.startsWith("env:")) {
      const envVar = credentialRef.slice(4);
      return process.env[envVar];
    }

    return credentialRef ?? undefined;
  }
}




