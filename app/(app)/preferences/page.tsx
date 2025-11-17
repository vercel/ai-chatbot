import { SettingsLayout, type SettingsSection } from "@/components/settings/settings-layout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const sections: SettingsSection[] = [
  {
    id: "general",
    title: "General",
    description:
      "Configure how the product behaves for you across all experiences.",
    content: (
      <form className="space-y-6" action="#">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="language">Language</FieldLabel>
            <Input
              id="language"
              name="language"
              type="text"
              defaultValue="English (US)"
              aria-describedby="language-description"
            />
            <FieldDescription id="language-description">
              Used for menus, notifications, and generated content.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="timezone">Time zone</FieldLabel>
            <Input
              id="timezone"
              name="timezone"
              type="text"
              defaultValue="UTC"
              aria-describedby="timezone-description"
            />
            <FieldDescription id="timezone-description">
              Determines when scheduled automations and reminders run.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit" variant="default">
            Save general preferences
          </Button>
        </div>
      </form>
    ),
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Fine tune when and where you are notified about important updates.",
    content: (
      <form className="space-y-6" action="#">
        <div className="space-y-4" role="group" aria-labelledby="notification-preferences">
          <div className="space-y-3">
            <h3 id="notification-preferences" className="text-sm font-medium">
              Delivery channels
            </h3>
            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                name="notifications_email"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-muted-foreground/40"
              />
              <span className="text-sm leading-relaxed">
                <span className="font-medium">Email</span>
                <br />
                Receive summaries and alerts in your inbox.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                name="notifications_push"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-muted-foreground/40"
              />
              <span className="text-sm leading-relaxed">
                <span className="font-medium">In-app</span>
                <br />
                Show alerts while you are working in the product.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                name="notifications_sms"
                className="mt-1 h-4 w-4 rounded border-muted-foreground/40"
              />
              <span className="text-sm leading-relaxed">
                <span className="font-medium">SMS</span>
                <br />
                Send high-priority alerts to your phone.
              </span>
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save notification settings</Button>
        </div>
      </form>
    ),
  },
  {
    id: "appearance",
    title: "Appearance & accessibility",
    description:
      "Personalise the interface to make working more comfortable.",
    content: (
      <form className="space-y-6" action="#">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="theme">Theme</FieldLabel>
            <Input
              id="theme"
              name="theme"
              type="text"
              defaultValue="Follow system"
            />
            <FieldDescription>
              Choose between light, dark, or automatically match your device.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="content-density">Content density</FieldLabel>
            <Input
              id="content-density"
              name="content-density"
              type="text"
              defaultValue="Comfortable"
            />
            <FieldDescription>
              Controls spacing for tables, lists, and other data-heavy views.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="accessibility-notes">
              Accessibility notes
            </FieldLabel>
            <Textarea
              id="accessibility-notes"
              name="accessibility-notes"
              rows={4}
              placeholder="Describe any assistive technologies or preferences we should consider."
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit">Save appearance settings</Button>
        </div>
      </form>
    ),
  },
];

export default function PreferencesPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SettingsLayout
        title="Preferences"
        description="Update how Splx behaves just for you. Changes here only affect your personal experience."
        sections={sections}
      />
    </div>
  );
}



