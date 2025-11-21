"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";
import type { WizardStepProps, RelationshipConfig } from "@/lib/build/table-wizard/types";

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Failed to fetch");
  const data = await response.json();
  return data.tables || [];
};

const RELATIONSHIP_TYPES = [
  { value: "one_to_one", label: "One to One" },
  { value: "one_to_many", label: "One to Many" },
  { value: "many_to_many", label: "Many to Many" },
];

export function Step4Relationships({
  state,
  updateState,
}: WizardStepProps) {
  const { data: tables } = useSWR("/api/tables?type=config", fetcher);

  const addRelationship = () => {
    const newRelationship: RelationshipConfig = {
      table_name: state.id,
      foreign_key_column: "",
      referenced_table: "",
      referenced_column: "id",
      relationship_type: "one_to_many",
    };
    updateState({
      relationships: [...state.relationships, newRelationship],
    });
  };

  const removeRelationship = (index: number) => {
    updateState({
      relationships: state.relationships.filter((_, i) => i !== index),
    });
  };

  const updateRelationship = (
    index: number,
    updates: Partial<RelationshipConfig>
  ) => {
    const newRelationships = [...state.relationships];
    newRelationships[index] = { ...newRelationships[index], ...updates };
    updateState({ relationships: newRelationships });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Relationships</h2>
        <p className="text-muted-foreground">
          Configure foreign key relationships to other tables. This enables label field display and referential integrity.
        </p>
      </div>

      <div className="space-y-3">
        {state.relationships.map((relationship, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Foreign Key Column</Label>
                    <Input
                      value={relationship.foreign_key_column}
                      onChange={(e) =>
                        updateRelationship(index, {
                          foreign_key_column: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, "_"),
                        })
                      }
                      placeholder="foreign_key_id"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Referenced Table</Label>
                    <Select
                      value={relationship.referenced_table}
                      onValueChange={(value) =>
                        updateRelationship(index, {
                          referenced_table: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables?.map((table: { id: string; name: string }) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Referenced Column</Label>
                    <Input
                      value={relationship.referenced_column}
                      onChange={(e) =>
                        updateRelationship(index, {
                          referenced_column: e.target.value,
                        })
                      }
                      placeholder="id"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Relationship Type</Label>
                    <Select
                      value={relationship.relationship_type || "one_to_many"}
                      onValueChange={(value) =>
                        updateRelationship(index, {
                          relationship_type: value as
                            | "one_to_one"
                            | "one_to_many"
                            | "many_to_many",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Label Field (Optional)</Label>
                  <Input
                    value={relationship.label_field || ""}
                    onChange={(e) =>
                      updateRelationship(index, {
                        label_field: e.target.value,
                      })
                    }
                    placeholder="name"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field from referenced table to display instead of ID
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRelationship(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addRelationship}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Relationship
        </Button>
      </div>
    </div>
  );
}

