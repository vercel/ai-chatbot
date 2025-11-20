"use client";

import { useMemo } from "react";
import type { PageRecord } from "@/lib/server/pages";
import { pageRecordToDraft } from "./transformers";
import { ViewBlock } from "./view-block";
import {
  ListBlockView,
  RecordBlockView,
  ReportBlockView,
  TriggerBlockView,
} from "./blocks";
import type { PageBlockDraft } from "./types";

export type PageViewerProps = {
  page: PageRecord;
  urlParams: Record<string, string>;
};

export function PageViewer({ page, urlParams }: PageViewerProps) {
  const draft = useMemo(() => pageRecordToDraft(page), [page]);

  if (draft.blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        This page does not have any blocks yet. Switch to edit mode to configure
        the layout.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 lg:grid-cols-6 sm:grid-cols-1">
      {draft.blocks.map((block) => (
        <ViewBlock
          key={block.id}
          id={block.id}
          type={block.type}
          position={block.position}
        >
          {renderBlock(block, urlParams)}
        </ViewBlock>
      ))}
    </div>
  );
}

function renderBlock(
  block: PageBlockDraft,
  urlParams: Record<string, string>
) {
  switch (block.type) {
    case "list":
      return <ListBlockView block={block} urlParams={urlParams} />;
    case "record":
      return <RecordBlockView block={block} urlParams={urlParams} />;
    case "report":
      return <ReportBlockView block={block} />;
    case "trigger":
      return <TriggerBlockView block={block} />;
    default: {
      // TypeScript exhaustiveness check narrows to 'never', but we need to handle runtime cases
      const blockType = (block as { type: string }).type;
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Unsupported block type: {String(blockType)}
        </div>
      );
    }
  }
}

