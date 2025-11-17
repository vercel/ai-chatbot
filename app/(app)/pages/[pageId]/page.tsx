import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageScreen } from "@/components/pages/page-screen";
import { getPageById } from "@/lib/server/pages";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { hasCapability } from "@/lib/server/tenant/permissions";

type PageRouteParams = {
  pageId: string;
};

type PageRouteSearchParams = Record<string, string | string[] | undefined>;

type PageRouteProps = {
  params: PageRouteParams | Promise<PageRouteParams>;
  searchParams: PageRouteSearchParams | Promise<PageRouteSearchParams>;
};

export default async function WorkspacePage({
  params,
  searchParams,
}: PageRouteProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { pageId } = resolvedParams;
  const tenant = await resolveTenantContext();
  if (process.env.NODE_ENV !== "production") {
    console.info("[pages] resolved tenant", {
      workspaceId: tenant.workspaceId,
      roles: tenant.roles,
      userId: tenant.userId,
      pageId,
    });
  }
  if (!hasCapability(tenant, "pages.view")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[pages] missing pages.view capability", {
        pageId,
        roles: tenant.roles,
      });
    }
    notFound();
  }
  const page = await getPageById(tenant, pageId);

  if (!page) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[pages] page not found", {
        pageId,
        workspaceId: tenant.workspaceId,
      });
    }
    notFound();
  }

  const viewMode = resolveViewMode(resolvedSearchParams.viewMode);
  const urlParams = extractUrlParams(resolvedSearchParams);
  const canEdit = hasCapability(tenant, "pages.edit");
  const effectiveMode = canEdit ? viewMode : "read";

  if (process.env.NODE_ENV !== "production") {
    console.info("[pages] rendering page", {
      pageId,
      mode: effectiveMode,
      canEdit,
      urlParams,
    });
  }

  return (
    <PageScreen
      page={page}
      viewMode={effectiveMode}
      urlParams={urlParams}
      canEdit={canEdit}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: PageRouteParams | Promise<PageRouteParams>;
}): Promise<Metadata> {
  try {
    const tenant = await resolveTenantContext();
    const resolvedParams = await params;
    if (!hasCapability(tenant, "pages.view")) {
      return {
        title: "Pages",
      };
    }
    const page = await getPageById(tenant, resolvedParams.pageId);

    if (!page) {
      return {
        title: "Page not found",
      };
    }

    return {
      title: `${page.name} · Pages`,
      description: page.description ?? undefined,
    };
  } catch {
    return {
      title: "Pages",
    };
  }
}

function resolveViewMode(
  rawMode: string | string[] | undefined
): "read" | "edit" {
  if (Array.isArray(rawMode)) {
    return resolveViewMode(rawMode[rawMode.length - 1]);
  }

  return rawMode === "edit" ? "edit" : "read";
}

function extractUrlParams(
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "viewMode") {
      continue;
    }

    if (typeof value === "string") {
      params[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      const lastValue = value[value.length - 1];
      if (typeof lastValue === "string") {
        params[key] = lastValue;
      }
    }
  }

  return params;
}

