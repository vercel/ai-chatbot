import type { PageBlock, PageSettings } from "@/lib/server/pages/schema";
import type { TableRecord } from "../../schema";

/**
 * Generates a list page block for a table
 */
export function generateListPageBlock(
  tableConfig: TableRecord
): PageBlock {
  return {
    id: `${tableConfig.id}_list`,
    type: "list",
    position: {
      x: 0,
      y: 0,
      width: 12,
      height: 8,
    },
    dataSource: {
      type: "table",
      tableName: tableConfig.id,
      endpoint: `/api/data/${tableConfig.id}`,
    },
    displayConfig: {
      title: tableConfig.name,
      showSearch: true,
      showFilters: true,
      pageSize: 20,
    },
  };
}

/**
 * Generates a detail page block for a table
 */
export function generateDetailPageBlock(
  tableConfig: TableRecord
): PageBlock {
  return {
    id: `${tableConfig.id}_detail`,
    type: "record",
    position: {
      x: 0,
      y: 0,
      width: 12,
      height: 10,
    },
    dataSource: {
      type: "table",
      tableName: tableConfig.id,
      endpoint: `/api/data/${tableConfig.id}`,
      recordIdParam: "id",
    },
    displayConfig: {
      title: tableConfig.name,
      showEditButton: true,
      showDeleteButton: true,
    },
  };
}

/**
 * Generates default page settings
 */
export function generatePageSettings(
  tableConfig: TableRecord,
  isDetail = false
): PageSettings {
  return {
    urlParams: isDetail
      ? [
          {
            name: "id",
            required: true,
            description: `Record ID for ${tableConfig.name}`,
          },
        ]
      : [],
    hideHeader: false,
  };
}

