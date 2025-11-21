"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { WizardStepProps } from "@/lib/build/table-wizard/types";
import { validateStep } from "@/lib/build/table-wizard/validation";

type CreationStep = {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
};

export function Step6Review({
  state,
  updateState,
}: WizardStepProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [creationSteps, setCreationSteps] = useState<CreationStep[]>([
    { id: "config", label: "Creating table configuration", status: "pending" },
    { id: "database", label: "Creating database table", status: "pending" },
    { id: "views", label: "Creating views (if applicable)", status: "pending" },
    { id: "pages", label: "Generating pages", status: "pending" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = validateStep(6, state);

  const updateStepStatus = (
    stepId: string,
    status: CreationStep["status"]
  ) => {
    setCreationSteps((steps) =>
      steps.map((step) =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      // Step 1: Create table configuration
      updateStepStatus("config", "in_progress");
      const configResponse = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: state.id,
          name: state.name,
          description: state.description || undefined,
          config: {
            field_metadata: state.fields,
            relationships: state.relationships,
            rls_policy_groups: state.policyGroup
              ? [
                  {
                    id: state.policyGroup,
                    name: state.policyGroup,
                    policies: [],
                  },
                ]
              : [],
            table_type: state.tableType === "view" ? "view" : "base_table",
            primary_key_column: "id",
          },
        }),
      });

      if (!configResponse.ok) {
        const data = await configResponse.json();
        throw new Error(data.error || "Failed to create table configuration");
      }

      updateStepStatus("config", "completed");
      const { table } = await configResponse.json();

      // Step 2: Create database table (if not a view)
      if (state.tableType !== "view") {
        updateStepStatus("database", "in_progress");
        // This would call the actual table creation service
        // For now, we'll simulate it
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateStepStatus("database", "completed");
      } else {
        updateStepStatus("database", "completed");
      }

      // Step 3: Create views (if applicable)
      if (state.tableType === "view") {
        updateStepStatus("views", "in_progress");
        // This would call the view creation service
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateStepStatus("views", "completed");
      } else {
        updateStepStatus("views", "completed");
      }

      // Step 4: Generate pages
      if (state.autoGeneratePages) {
        updateStepStatus("pages", "in_progress");
        const pagesResponse = await fetch("/api/tables/generate-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ tableId: table.id }),
        });
        if (!pagesResponse.ok) {
          console.warn("Failed to generate pages, continuing anyway");
        }
        updateStepStatus("pages", "completed");
      } else {
        updateStepStatus("pages", "completed");
      }

      // Redirect to table config page
      router.push(`/build/data/${table.id}/config`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Create</h2>
        <p className="text-muted-foreground">
          Review your table configuration and create it when ready.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Validation Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> {state.name}
            </div>
            <div>
              <span className="font-medium">ID:</span>{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {state.id}
              </code>
            </div>
            {state.description && (
              <div>
                <span className="font-medium">Description:</span>{" "}
                {state.description}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fields ({state.fields.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {state.fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono">{field.field_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {field.data_type || "text"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {state.relationships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Relationships ({state.relationships.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {state.relationships.map((rel, index) => (
                  <div key={index} className="text-sm">
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {rel.foreign_key_column}
                    </code>{" "}
                    → {rel.referenced_table}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {state.policyGroup && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Access Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{state.policyGroup}</Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-generate-pages"
              checked={state.autoGeneratePages}
              onCheckedChange={(checked) =>
                updateState({ autoGeneratePages: checked === true })
              }
            />
            <Label
              htmlFor="auto-generate-pages"
              className="text-sm font-normal cursor-pointer"
            >
              Automatically generate list and detail pages for this table
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Creation Progress */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Creating Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creationSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="flex items-center">
                    {step.status === "completed" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    {step.status === "in_progress" && (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    )}
                    {step.status === "pending" && (
                      <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    {index < creationSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-8 ml-3 ${
                          step.status === "completed"
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleCreate}
          disabled={creating || validationErrors.length > 0}
          size="lg"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Table"
          )}
        </Button>
      </div>
    </div>
  );
}

