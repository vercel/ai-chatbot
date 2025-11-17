import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-12 pt-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          These details are visible to your teammates across Splx. Keep them up
          to date so people know who they are collaborating with.
        </p>
      </div>
      <form className="mt-8 space-y-8" action="#">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="profile-firstname">First name</FieldLabel>
            <Input
              id="profile-firstname"
              name="profile-firstname"
              type="text"
              defaultValue="Casey"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-lastname">Last name</FieldLabel>
            <Input
              id="profile-lastname"
              name="profile-lastname"
              type="text"
              defaultValue="Morgan"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input
              id="profile-email"
              name="profile-email"
              type="email"
              defaultValue="casey@example.com"
              aria-describedby="profile-email-description"
            />
            <FieldDescription id="profile-email-description">
              Changing your email address may require verification.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-title">Job title</FieldLabel>
            <Input
              id="profile-title"
              name="profile-title"
              type="text"
              defaultValue="Operations Manager"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-avatar">
              Profile picture URL
            </FieldLabel>
            <Input
              id="profile-avatar"
              name="profile-avatar"
              type="url"
              placeholder="https://example.com/avatar.png"
            />
            <FieldDescription>
              Images should be square and at least 128 × 128 pixels.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-bio">About you</FieldLabel>
            <Textarea
              id="profile-bio"
              name="profile-bio"
              rows={4}
              placeholder="Share a short bio or anything you’d like teammates to know."
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">Save profile</Button>
        </div>
      </form>
    </div>
  );
}




