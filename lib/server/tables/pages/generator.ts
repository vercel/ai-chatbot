import { createPage } from "@/lib/server/pages";
import type { TenantContext } from "@/lib/server/tenant/context";
import type { TableRecord } from "../schema";
import {
  generateListPageBlock,
  generateDetailPageBlock,
  generatePageSettings,
} from "./templates";

/**
 * Auto-generates a list page for a table
 */
export async function generateListPage(
  tenant: TenantContext,
  tableConfig: TableRecord
): Promise<void> {
  const pageId = `${tableConfig.id}_list`;
  const listBlock = generateListPageBlock(tableConfig);
  const settings = generatePageSettings(tableConfig, false);

  await createPage(tenant, {
    id: pageId,
    name: `${tableConfig.name} - List`,
    description: `List view for ${tableConfig.name}`,
    blocks: [listBlock],
    layout: {},
    settings,
  });
}

/**
 * Auto-generates a detail page for a table
 */
export async function generateDetailPage(
  tenant: TenantContext,
  tableConfig: TableRecord
): Promise<void> {
  const pageId = `${tableConfig.id}_detail`;
  const detailBlock = generateDetailPageBlock(tableConfig);
  const settings = generatePageSettings(tableConfig, true);

  await createPage(tenant, {
    id: pageId,
    name: `${tableConfig.name} - Detail`,
    description: `Detail view for ${tableConfig.name}`,
    blocks: [detailBlock],
    layout: {},
    settings,
  });
}

/**
 * Auto-generates both list and detail pages for a table
 */
export async function generatePagesForTable(
  tenant: TenantContext,
  tableConfig: TableRecord
): Promise<{ listPageId: string; detailPageId: string }> {
  await generateListPage(tenant, tableConfig);
  await generateDetailPage(tenant, tableConfig);

  return {
    listPageId: `${tableConfig.id}_list`,
    detailPageId: `${tableConfig.id}_detail`,
  };
}

