"use client";
import { useState } from "react";
import CreateTwinDialog from "@/components/create-twin-dialog";
import TwinCard from "@/components/twin-card";
import { TWINS } from "@/lib/mock-data";
import type { Twin } from "@/lib/types";

export default function TwinsPage() {
  const [twins, setTwins] = useState<Twin[]>(TWINS);
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {twins.map((twin) => (
          <TwinCard key={twin.id} twin={twin} />
        ))}

        <TwinCard isPlaceholder onClick={() => setDialogOpen(true)} />
      </div>

      <CreateTwinDialog
        onCreate={handleCreate}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />
    </div>
  );
}
