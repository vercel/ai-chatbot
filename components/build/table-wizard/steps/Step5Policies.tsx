"use client";

import { Shield, Lock, Users, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { WizardStepProps } from "@/lib/build/table-wizard/types";
import { DEFAULT_POLICY_GROUPS } from "@/lib/build/table-wizard/policy-groups";

const policyGroupIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  workspace_member_full: Users,
  workspace_member_readonly: Users,
  role_based_full: Shield,
  public_readonly: Globe,
  private_full: Lock,
};

export function Step5Policies({
  state,
  updateState,
}: WizardStepProps) {
  const policyGroups = DEFAULT_POLICY_GROUPS;

  const handlePolicyGroupSelect = (groupId: string) => {
    updateState({ policyGroup: groupId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Access Policies</h2>
        <p className="text-muted-foreground">
          Configure Row Level Security (RLS) policies to control who can access and modify records in this table.
        </p>
      </div>

      <div className="space-y-3">
        {policyGroups.map((group) => {
          const Icon =
            policyGroupIcons[group.id] || Shield;
          const isSelected = state.policyGroup === group.id;

          return (
            <Card
              key={group.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? "border-primary border-2" : ""
              }`}
              onClick={() => handlePolicyGroupSelect(group.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {group.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {group.policies.map((policy) => (
                        <span
                          key={policy.id}
                          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {policy.policy_type}
                        </span>
                      ))}
                    </div>
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

      {!state.policyGroup && (
        <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
          Select a policy group above, or leave unselected to configure later
        </div>
      )}
    </div>
  );
}

