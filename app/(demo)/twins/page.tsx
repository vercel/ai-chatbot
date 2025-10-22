"use client";
import { Suspense, useState } from "react";
import CreateTwinDialog from "@/components/create-twin-dialog";
import { GridSkeleton } from "@/components/LoadingSkeleton";
import TwinCard from "@/components/twin-card";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { TWINS } from "@/lib/mockData";
import type { Twin } from "@/lib/types";

export default function TwinsPage() {
  const [twins, setTwins] = useLocalStorage<Twin[]>("demo-twins", TWINS);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (newTwin: Twin) => {
    setTwins((prev) => [...prev, newTwin]);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Twins</h1>
        <p className="mt-1 text-muted-foreground">
          Glen AI is the first of many. Create purpose-built AI twins with
          governed knowledge.
        </p>
      </div>

      <Suspense fallback={<GridSkeleton cards={6} />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {twins.map((twin) => (
            <TwinCard key={twin.id} twin={twin} />
          ))}

          <TwinCard isPlaceholder onClick={() => setDialogOpen(true)} />
        </div>
      </Suspense>

      <CreateTwinDialog
        onCreate={handleCreate}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />
    </div>
  );
}
