"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateWorkspace, type UpdateWorkspaceState } from "./actions";
import { useEffect } from "react";
import { toast } from "sonner";
import type { Workspace } from "@/lib/db/schema";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save workspace profile"}
    </Button>
  );
}

export function WorkspaceProfileForm({ workspace }: { workspace: Workspace }) {
  const initialState: UpdateWorkspaceState = { status: "idle" };
  const [state, formAction] = useFormState(updateWorkspace, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Workspace updated successfully");
    } else if (state.status === "failed" || state.status === "invalid_data") {
      toast.error(state.message ?? "Failed to update workspace");
    }
  }, [state]);

  return (
    <form className="space-y-6" action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
          <Input
            id="workspace-name"
            name="name"
            type="text"
            defaultValue={workspace.name}
            required
          />
          <FieldDescription>
            Displayed to all members and in shared documents.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="workspace-slug">Workspace URL</FieldLabel>
          <Input
            id="workspace-slug"
            name="slug"
            type="text"
            defaultValue={workspace.slug ?? ""}
            placeholder="your-workspace-slug"
          />
          <FieldDescription>
            Used for invite links and connecting integrations.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="workspace-avatar">
            Workspace avatar URL
          </FieldLabel>
          <Input
            id="workspace-avatar"
            name="avatar_url"
            type="url"
            defaultValue={workspace.avatar_url ?? ""}
            placeholder="https://example.com/logo.png"
          />
          <FieldDescription>
            Logo or icon representing your workspace.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="workspace-description">
            Business description
          </FieldLabel>
          <Textarea
            id="workspace-description"
            name="description"
            rows={4}
            defaultValue={workspace.description ?? ""}
            placeholder="Describe the work your organisation does to help teammates and AI features understand the context."
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
