"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TableConfig = {
  id: string;
  name: string;
  description: string | null;
  config: {
    label_fields?: Array<{ field_name: string; display_name?: string }>;
    relationships?: unknown[];
    field_metadata?: unknown[];
    rls_policy_templates?: unknown[];
    rls_policy_groups?: unknown[];
  };
};

export default function TableConfigPage() {
  const params = useParams();
  const router = useRouter();
  const tableName = params.tableName as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableConfig, setTableConfig] = useState<TableConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    async function loadTableConfig() {
      try {
        const response = await fetch(`/api/tables/${tableName}`, {
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Failed to load table configuration");
        }

        const { table } = await response.json();
        setTableConfig(table);
        setFormData({
          name: table.name,
          description: table.description || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (tableName) {
      loadTableConfig();
    }
  }, [tableName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tables/${tableName}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update table");
      }

      const { table } = await response.json();
      setTableConfig(table);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading table configuration...</div>
      </div>
    );
  }

  if (!tableConfig) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-destructive">
          Table configuration not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Configure Table: {tableConfig.name}</CardTitle>
          <CardDescription>
            Manage table settings, relationships, and access policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="policies">RLS Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Table Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={512}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="fields">
              <div className="text-sm text-muted-foreground">
                Field metadata configuration coming soon. You can configure
                display names, validation rules, and visibility settings here.
              </div>
            </TabsContent>

            <TabsContent value="relationships">
              <div className="text-sm text-muted-foreground">
                Relationship configuration coming soon. You can configure
                foreign keys and label fields here.
              </div>
            </TabsContent>

            <TabsContent value="policies">
              <div className="text-sm text-muted-foreground">
                RLS policy configuration coming soon. You can configure access
                policies and templates here.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

