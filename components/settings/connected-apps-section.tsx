"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Database, Sparkles } from "lucide-react";

import type { AppMode } from "@/lib/app-mode";
import { ConnectedAppCard } from "@/components/settings/connected-app-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type ConnectedApp = {
  id?: string;
  type: "postgres" | "openai";
  configured: boolean;
  source: "database" | "env";
  updatedAt?: string;
  metadata?: Record<string, unknown>;
};

type ApiResponse = {
  app: ConnectedApp;
};

type PostgresFormState = {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  schema: string;
  sslMode: "prefer" | "require" | "disable";
};

type OpenAiFormState = {
  apiKey: string;
  organization: string;
};

const POSTGRES_DEFAULT_STATE: PostgresFormState = {
  host: "",
  port: "5432",
  database: "",
  username: "",
  password: "",
  schema: "",
  sslMode: "prefer",
};

const OPENAI_DEFAULT_STATE: OpenAiFormState = {
  apiKey: "",
  organization: "",
};

const postgresBadgeClass =
  "bg-blue-600/10 text-blue-900 border-blue-300 dark:text-blue-100 dark:bg-blue-500/10";
const openaiBadgeClass =
  "bg-violet-600/10 text-violet-900 border-violet-300 dark:text-violet-100 dark:bg-violet-500/10";

const fetcher = async (url: string): Promise<ConnectedApp> => {
  const response = await fetch(url, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = "Unable to load app status";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // ignore json parsing errors
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as ApiResponse;
  return payload.app;
};

export function ConnectedAppsSettings({ mode }: { mode: AppMode }) {
  const {
    data: postgresApp,
    error: postgresError,
    isLoading: postgresLoading,
    mutate: refreshPostgres,
  } = useSWR<ConnectedApp>("/api/workspace-apps/postgres", fetcher);

  const {
    data: openAiApp,
    error: openAiError,
    isLoading: openAiLoading,
    mutate: refreshOpenAi,
  } = useSWR<ConnectedApp>("/api/workspace-apps/openai", fetcher);

  const [postgresForm, setPostgresForm] = useState<PostgresFormState>(
    POSTGRES_DEFAULT_STATE
  );
  const [postgresDirty, setPostgresDirty] = useState(false);
  const [postgresSaving, setPostgresSaving] = useState(false);
  const [postgresConnectionString, setPostgresConnectionString] = useState("");
  const [connectionStringError, setConnectionStringError] = useState<
    string | null
  >(null);
  const [showPostgresAdvanced, setShowPostgresAdvanced] = useState(false);

  const [openAiForm, setOpenAiForm] =
    useState<OpenAiFormState>(OPENAI_DEFAULT_STATE);
  const [openAiDirty, setOpenAiDirty] = useState(false);
  const [openAiSaving, setOpenAiSaving] = useState(false);

  useEffect(() => {
    if (postgresApp && !postgresDirty) {
      const nextState = derivePostgresState(postgresApp.metadata);
      setPostgresForm(nextState);
      setPostgresConnectionString(
        deriveConnectionString(postgresApp.metadata ?? {}, nextState)
      );
      setConnectionStringError(null);
    }
  }, [postgresApp, postgresDirty]);

  useEffect(() => {
    if (openAiApp && !openAiDirty) {
      setOpenAiForm(deriveOpenAiState(openAiApp.metadata));
    }
  }, [openAiApp, openAiDirty]);

  const postgresStatus = buildStatusLabel(postgresApp);
  const openAiStatus = buildStatusLabel(openAiApp);

  const postgresStatusDetail = buildStatusDetail(postgresApp);
  const openAiStatusDetail = buildStatusDetail(openAiApp);

  const sourceBadge = useMemo(
    () => (app?: ConnectedApp) =>
      app
        ? app.source === "env"
          ? ".env.local"
          : "Workspace storage"
        : mode === "local"
          ? ".env.local"
          : "Workspace storage",
    [mode]
  );

  const handleConnectionStringChange = useCallback(
    (value: string) => {
      setPostgresConnectionString(value);
      const parsed = parseConnectionString(value);
      if (!parsed) {
        setConnectionStringError("Enter a valid Postgres connection string");
        return;
      }
      setConnectionStringError(null);
      setPostgresDirty(true);
      setPostgresForm((prev) => ({
        ...prev,
        ...parsed,
      }));
    },
    []
  );

  async function handlePostgresSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPostgresSaving(true);
    try {
      const payload = {
        host: postgresForm.host.trim(),
        port: Number.parseInt(postgresForm.port, 10) || 5432,
        database: postgresForm.database.trim(),
        username: postgresForm.username.trim(),
        password: postgresForm.password ? postgresForm.password : undefined,
        schema: postgresForm.schema.trim() || undefined,
        sslMode: postgresForm.sslMode,
      };

      const response = await fetch("/api/workspace-apps/postgres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to save Postgres settings");
      }

      toast.success("Postgres connection updated");
      setPostgresDirty(false);
      setPostgresForm((prev) => ({ ...prev, password: "" }));
      await refreshPostgres();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update Postgres connection"
      );
    } finally {
      setPostgresSaving(false);
    }
  }

  async function handleOpenAiSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpenAiSaving(true);
    try {
      const payload = {
        apiKey: openAiForm.apiKey.trim(),
        organization: openAiForm.organization.trim() || undefined,
      };

      const response = await fetch("/api/workspace-apps/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to save OpenAI key");
      }

      toast.success("OpenAI credentials updated");
      setOpenAiDirty(false);
      setOpenAiForm((prev) => ({ ...prev, apiKey: "" }));
      await refreshOpenAi();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update OpenAI credentials"
      );
    } finally {
      setOpenAiSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ConnectedAppCard
        title="Postgres"
        description="Configure the primary database connection used for loading workspace data."
        status={postgresStatus}
        statusVariant={postgresApp?.configured ? "secondary" : "outline"}
        statusDetail={postgresStatusDetail}
        icon={<Database className="size-6" />}
        iconAccentClassName="bg-gradient-to-br from-blue-50 to-white border-blue-200 text-blue-700"
        tone={postgresApp?.configured ? "success" : "neutral"}
        actions={
          <Badge className={postgresBadgeClass}>{sourceBadge(postgresApp)}</Badge>
        }
      >
        {postgresError ? (
          <ErrorNotice message={postgresError.message} />
        ) : postgresLoading && !postgresApp ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <form className="space-y-6" onSubmit={handlePostgresSubmit}>
            <Field>
              <FieldLabel htmlFor="pg-connection">Connection string</FieldLabel>
              <Input
                id="pg-connection"
                name="pg-connection"
                spellCheck={false}
                placeholder="postgresql://user:pass@host:5432/db"
                value={postgresConnectionString}
                onChange={(event) =>
                  handleConnectionStringChange(event.target.value)
                }
              />
              {connectionStringError ? (
                <p className="text-xs text-destructive">{connectionStringError}</p>
              ) : (
                <FieldDescription>
                  This is written directly to your {mode === "local" ? ".env.local file" : "workspace connection"}.
                </FieldDescription>
              )}
            </Field>
            <div>
              <button
                type="button"
                className="text-sm font-medium text-blue-700 transition hover:text-blue-900"
                onClick={() => setShowPostgresAdvanced((prev) => !prev)}
                aria-expanded={showPostgresAdvanced}
              >
                {showPostgresAdvanced ? "Hide" : "Show"} advanced fields
              </button>
              {showPostgresAdvanced ? (
                <div className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="pg-host">Host</FieldLabel>
                      <Input
                        id="pg-host"
                        name="pg-host"
                        placeholder="db.example.com"
                        required
                        value={postgresForm.host}
                        onChange={(event) => {
                          setPostgresDirty(true);
                          const next = {
                            ...postgresForm,
                            host: event.target.value,
                          };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="pg-port">Port</FieldLabel>
                      <Input
                        id="pg-port"
                        name="pg-port"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={postgresForm.port}
                        onChange={(event) => {
                          setPostgresDirty(true);
                          const next = {
                            ...postgresForm,
                            port: event.target.value,
                          };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="pg-database">Database</FieldLabel>
                      <Input
                        id="pg-database"
                        name="pg-database"
                        placeholder="splx"
                        required
                        value={postgresForm.database}
                        onChange={(event) => {
                          setPostgresDirty(true);
                          const next = {
                            ...postgresForm,
                            database: event.target.value,
                          };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="pg-schema">Schema (optional)</FieldLabel>
                      <Input
                        id="pg-schema"
                        name="pg-schema"
                        placeholder="public"
                        value={postgresForm.schema}
                        onChange={(event) => {
                          setPostgresDirty(true);
                          const next = {
                            ...postgresForm,
                            schema: event.target.value,
                          };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="pg-username">Username</FieldLabel>
                      <Input
                        id="pg-username"
                        name="pg-username"
                        placeholder="workspace_user"
                        required
                        value={postgresForm.username}
                        onChange={(event) => {
                          setPostgresDirty(true);
                          const next = {
                            ...postgresForm,
                            username: event.target.value,
                          };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="pg-password">Password</FieldLabel>
                      <Input
                        id="pg-password"
                        name="pg-password"
                        type="password"
                        placeholder="••••••••"
                        value={postgresForm.password}
                        onChange={(event) => {
                          setPostgresDirty(true);
                          const next = {
                            ...postgresForm,
                            password: event.target.value,
                          };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      />
                      <FieldDescription>
                        Entering a password will replace the stored credential.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="pg-ssl">SSL mode</FieldLabel>
                      <Select
                        value={postgresForm.sslMode}
                        onValueChange={(value: PostgresFormState["sslMode"]) => {
                          setPostgresDirty(true);
                          const next = { ...postgresForm, sslMode: value };
                          setPostgresForm(next);
                          setPostgresConnectionString(
                            buildConnectionString(next)
                          );
                        }}
                      >
                        <SelectTrigger id="pg-ssl">
                          <SelectValue placeholder="Select SSL mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prefer">Prefer (default)</SelectItem>
                          <SelectItem value="require">Require</SelectItem>
                          <SelectItem value="disable">Disable</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={postgresLoading || postgresSaving}
                onClick={() => {
                  setPostgresDirty(false);
                  const resetState = derivePostgresState(postgresApp?.metadata);
                  setPostgresForm(resetState);
                  setPostgresConnectionString(
                    deriveConnectionString(postgresApp?.metadata ?? {}, resetState)
                  );
                  setConnectionStringError(null);
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={
                  postgresSaving ||
                  postgresLoading ||
                  !postgresDirty ||
                  Boolean(connectionStringError)
                }
              >
                {postgresSaving ? "Saving..." : "Save database settings"}
              </Button>
            </div>
          </form>
        )}
      </ConnectedAppCard>

      <ConnectedAppCard
        title="OpenAI"
        description="Authenticate OpenAI so Splx can call models on your behalf."
        status={openAiStatus}
        statusVariant={openAiApp?.configured ? "secondary" : "outline"}
        statusDetail={openAiStatusDetail}
        icon={<Sparkles className="size-6" />}
        iconAccentClassName="bg-gradient-to-br from-violet-50 to-white border-violet-200 text-violet-700"
        tone={openAiApp?.configured ? "success" : "neutral"}
        actions={
          <Badge className={openaiBadgeClass}>{sourceBadge(openAiApp)}</Badge>
        }
      >
        {openAiError ? (
          <ErrorNotice message={openAiError.message} />
        ) : openAiLoading && !openAiApp ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <form className="space-y-6" onSubmit={handleOpenAiSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="openai-key">API key</FieldLabel>
                <Input
                  id="openai-key"
                  name="openai-key"
                  placeholder="sk-..."
                  required
                  value={
                    openAiDirty
                      ? openAiForm.apiKey
                      : (openAiApp?.metadata?.maskedKey as string | undefined) ??
                        openAiForm.apiKey
                  }
                  onFocus={() => {
                    if (!openAiDirty) {
                      setOpenAiDirty(true);
                      setOpenAiForm((prev) => ({ ...prev, apiKey: "" }));
                    }
                  }}
                  onChange={(event) => {
                    setOpenAiDirty(true);
                    setOpenAiForm((prev) => ({
                      ...prev,
                      apiKey: event.target.value,
                    }));
                  }}
                />
                <FieldDescription>
                  We never display stored keys. Enter a new key to rotate
                  credentials.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="openai-org">Organization (optional)</FieldLabel>
                <Input
                  id="openai-org"
                  name="openai-org"
                  placeholder="org-..."
                  value={openAiForm.organization}
                  onChange={(event) => {
                    setOpenAiDirty(true);
                    setOpenAiForm((prev) => ({
                      ...prev,
                      organization: event.target.value,
                    }));
                  }}
                />
              </Field>
            </FieldGroup>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={openAiLoading || openAiSaving}
                onClick={() => {
                  setOpenAiDirty(false);
                  setOpenAiForm({
                    ...deriveOpenAiState(openAiApp?.metadata),
                    apiKey: "",
                  });
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={
                  openAiSaving ||
                  openAiLoading ||
                  !openAiDirty ||
                  openAiForm.apiKey.trim().length < 8
                }
              >
                {openAiSaving ? "Saving..." : "Save OpenAI settings"}
              </Button>
            </div>
          </form>
        )}
      </ConnectedAppCard>
    </div>
  );
}

function derivePostgresState(
  metadata?: Record<string, unknown>
): PostgresFormState {
  if (!metadata) {
    return POSTGRES_DEFAULT_STATE;
  }

  return {
    host: (metadata.host as string) ?? "",
    port: metadata.port ? String(metadata.port) : POSTGRES_DEFAULT_STATE.port,
    database: (metadata.database as string) ?? "",
    username: (metadata.username as string) ?? "",
    password: "",
    schema: (metadata.schema as string) ?? "",
    sslMode:
      (metadata.sslMode as PostgresFormState["sslMode"]) ??
      POSTGRES_DEFAULT_STATE.sslMode,
  };
}

function deriveOpenAiState(
  metadata?: Record<string, unknown>
): OpenAiFormState {
  if (!metadata) {
    return OPENAI_DEFAULT_STATE;
  }

  return {
    apiKey: "",
    organization: (metadata.organization as string) ?? "",
  };
}

function buildStatusLabel(app?: ConnectedApp) {
  if (!app) {
    return "Checking...";
  }

  return app.configured ? "Connected" : "Not connected";
}

function buildStatusDetail(app?: ConnectedApp) {
  if (!app) {
    return undefined;
  }

  const storageLabel =
    app.source === "env" ? "Stored in .env.local" : "Stored in workspace";

  if (!app.configured) {
    return app.source === "env"
      ? "Updates will write to .env.local"
      : "Updates will be stored securely in Splx";
  }

  if (app.updatedAt) {
    const timestamp = Date.parse(app.updatedAt);
    if (!Number.isNaN(timestamp)) {
      return `${storageLabel} · ${formatDistanceToNow(timestamp, {
        addSuffix: true,
      })}`;
    }
  }

  return storageLabel;
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function deriveConnectionString(
  metadata: Record<string, unknown>,
  fallback: PostgresFormState
) {
  if (typeof metadata.connectionString === "string") {
    return metadata.connectionString;
  }

  if (fallback.host && fallback.database && fallback.username) {
    return buildConnectionString(fallback);
  }

  return "";
}

function buildConnectionString(state: PostgresFormState) {
  const user = encodeURIComponent(state.username || "");
  const password = state.password
    ? `:${encodeURIComponent(state.password)}`
    : "";
  const schema = state.schema ? `?schema=${encodeURIComponent(state.schema)}` : "";
  return `postgresql://${user}${password}@${state.host}:${state.port}/${state.database}${schema}`;
}

function parseConnectionString(input: string): PostgresFormState | null {
  try {
    const url = new URL(input);
    if (!url.protocol.startsWith("postgres")) {
      return null;
    }
    return {
      host: url.hostname ?? "",
      port: url.port || "5432",
      database: url.pathname.replace(/^\//, ""),
      username: decodeURIComponent(url.username ?? ""),
      password: decodeURIComponent(url.password ?? ""),
      schema: url.searchParams.get("schema") ?? "",
      sslMode: "prefer",
    };
  } catch {
    return null;
  }
}


