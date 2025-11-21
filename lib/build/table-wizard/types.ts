import type React from "react";
import type {
  TableConfig,
  FieldMetadata,
  RelationshipConfig,
  RLSPolicyGroup,
} from "@/lib/server/tables/schema";

// Re-export types for convenience
export type { FieldMetadata, RelationshipConfig, RLSPolicyGroup, TableConfig };

export type TableType = "new" | "view" | "import";

export type WizardState = {
  currentStep: number;
  tableType: TableType | null;
  baseTableId: string | null; // For view type
  id: string;
  name: string;
  description: string;
  fields: FieldMetadata[];
  relationships: RelationshipConfig[];
  policyGroup: string | null; // Policy group ID
  autoGeneratePages: boolean;
  validationErrors: Record<number, string[]>;
};

export type WizardStep = {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<WizardStepProps>;
};

export type WizardStepProps = {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  goToStep: (step: number) => void;
};

export const TOTAL_STEPS = 6;

