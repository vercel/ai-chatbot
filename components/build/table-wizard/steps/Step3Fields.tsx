"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { WizardStepProps, FieldMetadata } from "@/lib/build/table-wizard/types";
import { AIAssistant } from "../AIAssistant";

const DATA_TYPES = [
  { value: "text", label: "Text" },
  { value: "integer", label: "Integer" },
  { value: "uuid", label: "UUID" },
  { value: "boolean", label: "Boolean" },
  { value: "timestamp", label: "Timestamp" },
  { value: "date", label: "Date" },
  { value: "numeric", label: "Numeric" },
  { value: "json", label: "JSON" },
  { value: "jsonb", label: "JSONB" },
];

export function Step3Fields({
  state,
  updateState,
}: WizardStepProps) {
  const [expandedField, setExpandedField] = useState<number | null>(null);

  const addField = () => {
    const newField: FieldMetadata = {
      field_name: "",
      display_name: "",
      data_type: "text",
      is_required: false,
      is_unique: false,
    };
    updateState({
      fields: [...state.fields, newField],
    });
    setExpandedField(state.fields.length);
  };

  const removeField = (index: number) => {
    updateState({
      fields: state.fields.filter((_, i) => i !== index),
    });
    if (expandedField === index) {
      setExpandedField(null);
    }
  };

  const updateField = (index: number, updates: Partial<FieldMetadata>) => {
    const newFields = [...state.fields];
    newFields[index] = { ...newFields[index], ...updates };
    updateState({ fields: newFields });
  };

  const handleAIGenerate = (generatedFields: FieldMetadata[]) => {
    updateState({ fields: generatedFields });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Field Configuration</h2>
          <p className="text-muted-foreground">
            Define the columns/fields for your table. Each field represents a piece of data you'll store.
          </p>
        </div>
        <AIAssistant
          type="fields"
          description={state.description}
          onGenerate={handleAIGenerate}
        />
      </div>

      <div className="space-y-3">
        {state.fields.map((field, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="pt-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Field Name</Label>
                      <Input
                        value={field.field_name}
                        onChange={(e) =>
                          updateField(index, {
                            field_name: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, "_"),
                          })
                        }
                        placeholder="field_name"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Display Name</Label>
                      <Input
                        value={field.display_name || ""}
                        onChange={(e) =>
                          updateField(index, { display_name: e.target.value })
                        }
                        placeholder="Field Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Data Type</Label>
                      <Select
                        value={field.data_type || "text"}
                        onValueChange={(value) =>
                          updateField(index, { data_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATA_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Default Value (Optional)</Label>
                      <Input
                        value={field.default_value as string || ""}
                        onChange={(e) =>
                          updateField(index, { default_value: e.target.value })
                        }
                        placeholder="default"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={field.is_required || false}
                        onCheckedChange={(checked) =>
                          updateField(index, { is_required: checked === true })
                        }
                      />
                      <Label
                        htmlFor={`required-${index}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Required
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`unique-${index}`}
                        checked={field.is_unique || false}
                        onCheckedChange={(checked) =>
                          updateField(index, { is_unique: checked === true })
                        }
                      />
                      <Label
                        htmlFor={`unique-${index}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Unique
                      </Label>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addField}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>
  );
}

