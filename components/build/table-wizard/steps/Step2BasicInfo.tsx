"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WizardStepProps } from "@/lib/build/table-wizard/types";

export function Step2BasicInfo({
  state,
  updateState,
}: WizardStepProps) {
  const handleNameChange = (value: string) => {
    updateState({ name: value });

    // Auto-generate ID from name if ID is empty
    if (!state.id) {
      const generatedId = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      updateState({ id: generatedId });
    }
  };

  const handleIdChange = (value: string) => {
    // Only allow valid characters
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 64);
    updateState({ id: sanitized });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">
          Provide the fundamental details for your table. The table ID will be used for API routes and internal references.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={state.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Table"
            maxLength={120}
            required
          />
          <p className="text-xs text-muted-foreground">
            Human-readable name for the table ({state.name.length}/120)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="id">
            Table ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="id"
            value={state.id}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="my_table"
            pattern="[a-z0-9_-]+"
            maxLength={64}
            required
          />
          <p className="text-xs text-muted-foreground">
            Lowercase alphanumerics, hyphens, and underscores only. Used for API routes and internal references. ({state.id.length}/64)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={state.description}
            onChange={(e) =>
              updateState({ description: e.target.value })
            }
            placeholder="A brief description of what this table stores..."
            maxLength={512}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Optional description to help understand the table's purpose ({state.description.length}/512)
          </p>
        </div>
      </div>
    </div>
  );
}

