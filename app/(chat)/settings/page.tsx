import GoogleDriveSettings from "@/components/GoogleDriveSettings";
import { ensurePageSession } from "@/lib/auth/route-guards";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensurePageSession();
  const sp = (await searchParams) ?? {};
  const errParam = (sp.google_error ?? null) as string | null;
  return (
    <main className="p-6 md:p-10 space-y-8 max-w-5xl">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Configure your preferences and integrations
          </p>
        </div>
      </header>

      {errParam ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <strong className="font-medium">Google Drive connection failed.</strong>{" "}
          <span className="opacity-90">Error: {errParam}</span>
        </div>
      ) : null}

      <section>
        <GoogleDriveSettings />
      </section>
    </main>
  );
}
