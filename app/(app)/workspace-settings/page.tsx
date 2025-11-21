import { redirect } from "next/navigation";
import { SettingsLayout, type SettingsSection } from "@/components/settings/settings-layout";
import { ConnectedAppsSettings } from "@/components/settings/connected-apps-section";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AppMode } from "@/lib/app-mode";
import { getAppMode } from "@/lib/server/tenant/context";
import type { Workspace } from "@/lib/db/schema";
import { WorkspaceProfileForm } from "./workspace-form";
import { getWorkspaceData } from "./actions";

function createSections(mode: AppMode, workspace: Workspace): SettingsSection[] {
  return [
  {
    id: "workspace-profile",
    title: "Workspace profile",
    description:
      "Update the details that represent your organisation across Splx.",
    content: <WorkspaceProfileForm workspace={workspace} />,
  },
  {
    id: "collaboration",
    title: "Collaboration",
    description:
      "Control how members collaborate and how teams are organised.",
    content: (
      <form className="space-y-6" action="#">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="default-role">Default role for invites</FieldLabel>
            <Input
              id="default-role"
              name="default-role"
              type="text"
              defaultValue="Staff"
            />
            <FieldDescription>
              Applied to new members when they join via a shared invite link.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="team-structure">
              Team structure guidelines
            </FieldLabel>
            <Textarea
              id="team-structure"
              name="team-structure"
              rows={4}
              placeholder="Document how teams should be created and which roles to assign."
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit">Save collaboration settings</Button>
        </div>
      </form>
    ),
  },
  {
    id: "governance",
    title: "Governance & security",
    description:
      "Define security expectations and how data is managed across teams.",
    content: (
      <form className="space-y-6" action="#">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="data-retention">
              Data retention policy
            </FieldLabel>
            <Textarea
              id="data-retention"
              name="data-retention"
              rows={4}
              placeholder="Outline how long data should be kept and when it can be deleted."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="security-contact">
              Security contact email
            </FieldLabel>
            <Input
              id="security-contact"
              name="security-contact"
              type="email"
              defaultValue="security@acme.com"
            />
            <FieldDescription>
              Used when Splx needs to reach your organisation about compliance impacts.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit">Save governance settings</Button>
        </div>
      </form>
    ),
  },
  {
    id: "connected-apps",
    title: "Connected apps",
    description:
      "Connect Splx to your data sources and AI providers. In local mode changes are written to .env.local, while hosted workspaces store credentials securely.",
    content: <ConnectedAppsSettings mode={mode} />,
  },
];
}

export default async function WorkplaceSettingsPage() {
  const mode = getAppMode();
  const workspace = await getWorkspaceData();

  if (!workspace) {
    redirect("/signin");
  }

  const sections = createSections(mode, workspace);

  return (
    <SettingsLayout
      title="Workplace Settings"
      description="Manage the identity, structure, and policies for your organisation."
      sections={sections}
    />
  );
}


