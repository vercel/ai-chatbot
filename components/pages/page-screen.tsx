"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageBuilder } from "./builder/page-builder";
import type { PageSavePayload } from "./types";
import { PageViewer } from "./page-viewer";
import type { PageRecord } from "@/lib/server/pages";
import { Button } from "@/components/ui/button";

export type PageViewMode = "read" | "edit";

export type PageScreenProps = {
  page: PageRecord;
  viewMode: PageViewMode;
  urlParams: Record<string, string>;
  canEdit: boolean;
};

export function PageScreen({
  page,
  viewMode,
  urlParams,
  canEdit,
}: PageScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<PageRecord>(page);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  const urlParamMemo = useMemo(() => urlParams, [urlParams]);

  const handleToggleMode = () => {
    if (!canEdit) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === "edit") {
      params.delete("viewMode");
    } else {
      params.set("viewMode", "edit");
    }

    const queryString = params.toString();
    startTransition(() => {
      router.replace(
        queryString ? `${pathname}?${queryString}` : pathname,
        { scroll: false }
      );
    });
  };

  const handleSave = async (payload: PageSavePayload) => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/app/(app)/api/pages/${currentPage.id}/save`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let message = "Failed to save page";
        try {
          const data = await response.json();
          if (data?.error && typeof data.error === "string") {
            message = data.error;
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const data = await response.json();
      if (data?.page) {
        const updatedPage = data.page as PageRecord;
        const nextPath = `/pages/${updatedPage.id}`;
        if (updatedPage.id !== currentPage.id) {
          const query = searchParams.toString();
          router.replace(query ? `${nextPath}?${query}` : nextPath);
        }
        setCurrentPage(updatedPage);
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unexpected error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {currentPage.name}
          </h1>
          {currentPage.description ? (
            <p className="text-sm text-muted-foreground">
              {currentPage.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Mode: {viewMode === "edit" ? "Edit" : "Read"}
          </span>
          {canEdit ? (
            <Button
              type="button"
              variant={viewMode === "edit" ? "outline" : "default"}
              onClick={handleToggleMode}
              disabled={isPending}
            >
              {viewMode === "edit" ? "View mode" : "Edit mode"}
            </Button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {viewMode === "edit" && canEdit ? (
        <PageBuilder
          key={currentPage.updated_at}
          initialPage={currentPage}
          onSave={handleSave}
          onReset={() => setError(null)}
          isSaving={isSaving}
        />
      ) : (
        <PageViewer
          page={currentPage}
          urlParams={urlParamMemo}
        />
      )}
    </div>
  );
}

