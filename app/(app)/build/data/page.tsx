import { resolveTenantContext } from "@/lib/server/tenant/context";
import { requireCapability } from "@/lib/server/tenant/permissions";
import { DataTablesView } from "@/components/build/data-tables-view";

export default async function DataPage() {
  const tenant = await resolveTenantContext();
  requireCapability(tenant, "pages.view");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Tables</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your workspace data tables from the connected database.
        </p>
      </div>
      <DataTablesView />
    </div>
  );
}


