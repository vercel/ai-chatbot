"use client";

import { Database, Table2, Link2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardState } from "@/lib/build/table-wizard/types";

type TablePreviewProps = {
  state: WizardState;
};

export function TablePreview({ state }: TablePreviewProps) {
  const { currentStep, tableType, name, description, fields, relationships, policyGroup } = state;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Database className="w-6 h-6" />
          {name || "New Table"}
        </h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      {/* Table Type Preview */}
      {currentStep >= 1 && tableType && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Table Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {tableType === "new" && "New Object"}
              {tableType === "view" && "View/Version"}
              {tableType === "import" && "Import from Schema"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Schema Preview */}
      {currentStep >= 3 && fields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md bg-background border border-border"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium">
                      {field.field_name}
                    </div>
                    {field.display_name && (
                      <div className="text-xs text-muted-foreground">
                        {field.display_name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {field.data_type || "text"}
                    </Badge>
                    {field.is_required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {field.is_unique && (
                      <Badge variant="secondary" className="text-xs">
                        Unique
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationships Preview */}
      {currentStep >= 4 && relationships.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relationships.map((rel, index) => (
                <div
                  key={index}
                  className="p-2 rounded-md bg-background border border-border"
                >
                  <div className="text-sm font-medium">
                    {rel.foreign_key_column} → {rel.referenced_table}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rel.relationship_type || "one-to-many"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies Preview */}
      {currentStep >= 5 && policyGroup && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Access Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{policyGroup}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for early steps */}
      {currentStep < 3 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">
                Configure your table to see a live preview here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

