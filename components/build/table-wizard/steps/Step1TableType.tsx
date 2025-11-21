"use client";

import { Database, Layers, Import } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useSWR from "swr";
import type { WizardStepProps, TableType } from "@/lib/build/table-wizard/types";

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Failed to fetch");
  const data = await response.json();
  return data.tables || [];
};

export function Step1TableType({
  state,
  updateState,
}: WizardStepProps) {
  const { data: tables } = useSWR(
    state.tableType === "view" ? "/api/tables?type=config" : null,
    fetcher
  );

  const tableTypeOptions: Array<{
    value: TableType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      value: "new",
      label: "New Object",
      description: "Create a completely new table from scratch",
      icon: Database,
    },
    {
      value: "view",
      label: "New Version/View",
      description:
        "Create a view or variant of an existing table (e.g., customer/client/lead from a base 'people' table)",
      icon: Layers,
    },
    {
      value: "import",
      label: "Import from Schema",
      description: "Import an existing database table and configure it",
      icon: Import,
    },
  ];

  const handleTableTypeSelect = (value: TableType) => {
    updateState({
      tableType: value,
      baseTableId: value !== "view" ? null : state.baseTableId,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">What kind of table do you want to create?</h2>
        <p className="text-muted-foreground">
          Choose the type of table or object you'd like to create. This determines how we'll set up your table structure.
        </p>
      </div>

      <div className="grid gap-4">
        {tableTypeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = state.tableType === option.value;

          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? "border-primary border-2" : ""
              }`}
              onClick={() => handleTableTypeSelect(option.value)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {state.tableType === "view" && (
        <div className="space-y-2">
          <Label htmlFor="base-table">Base Table</Label>
          <Select
            value={state.baseTableId || ""}
            onValueChange={(value) => updateState({ baseTableId: value })}
          >
            <SelectTrigger id="base-table">
              <SelectValue placeholder="Select a base table" />
            </SelectTrigger>
            <SelectContent>
              {tables?.map((table: { id: string; name: string }) => (
                <SelectItem key={table.id} value={table.id}>
                  {table.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the existing table to create a view or variant from
          </p>
        </div>
      )}
    </div>
  );
}

