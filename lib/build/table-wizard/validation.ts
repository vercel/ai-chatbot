import type { WizardState } from "./types";

export function validateStep(step: number, state: WizardState): string[] {
  const errors: string[] = [];

  switch (step) {
    case 1:
      if (!state.tableType) {
        errors.push("Please select a table type");
      }
      if (state.tableType === "view" && !state.baseTableId) {
        errors.push("Please select a base table for the view");
      }
      break;

    case 2:
      if (!state.id || state.id.trim() === "") {
        errors.push("Table ID is required");
      } else if (!/^[a-z0-9_-]+$/.test(state.id)) {
        errors.push(
          "Table ID must use lowercase alphanumerics, hyphens, or underscores"
        );
      } else if (state.id.length > 64) {
        errors.push("Table ID must be 64 characters or fewer");
      }

      if (!state.name || state.name.trim() === "") {
        errors.push("Table name is required");
      } else if (state.name.length > 120) {
        errors.push("Table name must be 120 characters or fewer");
      }

      if (state.description && state.description.length > 512) {
        errors.push("Description must be 512 characters or fewer");
      }
      break;

    case 3:
      if (state.fields.length === 0) {
        errors.push("At least one field is required");
      }

      for (const field of state.fields) {
        if (!field.field_name || field.field_name.trim() === "") {
          errors.push("All fields must have a name");
        } else if (!/^[a-z0-9_]+$/.test(field.field_name)) {
          errors.push(
            `Field "${field.field_name}" must use lowercase alphanumerics and underscores`
          );
        }
      }
      break;

    case 4:
      // Relationships are optional, but if added, they must be valid
      for (const rel of state.relationships) {
        if (!rel.table_name || !rel.foreign_key_column || !rel.referenced_table) {
          errors.push("All relationships must have complete information");
        }
      }
      break;

    case 5:
      // Policies are optional, but if a group is selected, it should be valid
      // No validation needed here as policies are optional
      break;

    case 6:
      // Final validation - check all previous steps
      const step1Errors = validateStep(1, state);
      const step2Errors = validateStep(2, state);
      const step3Errors = validateStep(3, state);
      const step4Errors = validateStep(4, state);

      errors.push(...step1Errors, ...step2Errors, ...step3Errors, ...step4Errors);
      break;
  }

  return errors;
}

export function canProceedToNextStep(
  currentStep: number,
  state: WizardState
): boolean {
  const errors = validateStep(currentStep, state);
  return errors.length === 0;
}

