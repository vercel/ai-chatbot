import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { ConfigTablesView } from "@/components/build/config-tables-view";

export default async function ConfigPage() {
  const tenant = await resolveTenantContext();
  requireCapability(tenant, "pages.view");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Config Tables</h1>
        <p className="text-muted-foreground mt-2">
          View and manage workspace configuration tables (pages, workflows, roles, etc.).
        </p>
      </div>
      <ConfigTablesView />
    </div>
  );
}


