import { TypiaSetupWizard } from "@typia/setup";

TypiaSetupWizard.setup({
  input: "src/**/*.{ts,tsx}",
  output: "src/typia",
  e2e: "test/**/*.ts",
  assert: false,
  json: true,
});