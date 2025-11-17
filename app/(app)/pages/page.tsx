import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listPages } from "@/lib/server/pages";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { hasCapability } from "@/lib/server/tenant/permissions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pages",
  description: "Workspace pages configured via the dynamic pages builder.",
};

export default async function PagesIndex() {
  const tenant = await resolveTenantContext();
  if (!hasCapability(tenant, "pages.view")) {
    notFound();
  }

  const pages = await listPages(tenant);

  return (
    <div className="flex flex-1 flex-col gap-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Pages
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage dynamic application pages built with the layout builder.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-background p-6 shadow-sm">
        {pages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No pages exist yet. Use the builder to create your first page.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {pages.map((page) => (
              <li key={page.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/pages/${page.id}`}
                  className="group flex flex-col gap-1 rounded-md px-2 py-1 transition hover:bg-muted/40"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {page.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /pages/{page.id}
                  </span>
                  {page.description ? (
                    <span className="text-xs text-muted-foreground">
                      {page.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

