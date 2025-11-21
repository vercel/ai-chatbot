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
import { updateProfile, type UpdateProfileState } from "./actions";
import { useEffect } from "react";
import { toast } from "sonner";
import type { User } from "@/lib/db/schema";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save profile"}
    </Button>
  );
}

export function ProfileForm({ user }: { user: User }) {
  const initialState: UpdateProfileState = { status: "idle" };
  const [state, formAction] = useFormState(updateProfile, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile updated successfully");
    } else if (state.status === "failed" || state.status === "invalid_data") {
      toast.error(state.message ?? "Failed to update profile");
    }
  }, [state]);

  return (
    <form className="mt-8 space-y-8" action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-firstname">First name</FieldLabel>
          <Input
            id="profile-firstname"
            name="firstname"
            type="text"
            defaultValue={user.firstname ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-lastname">Last name</FieldLabel>
          <Input
            id="profile-lastname"
            name="lastname"
            type="text"
            defaultValue={user.lastname ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input
            id="profile-email"
            name="email"
            type="email"
            defaultValue={user.email}
            aria-describedby="profile-email-description"
            required
          />
          <FieldDescription id="profile-email-description">
            Changing your email address may require verification.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-title">Job title</FieldLabel>
          <Input
            id="profile-title"
            name="job_title"
            type="text"
            defaultValue={user.job_title ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-avatar">
            Profile picture URL
          </FieldLabel>
          <Input
            id="profile-avatar"
            name="avatar_url"
            type="url"
            defaultValue={user.avatar_url ?? ""}
            placeholder="https://example.com/avatar.png"
          />
          <FieldDescription>
            Images should be square and at least 128 × 128 pixels.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
