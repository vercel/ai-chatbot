import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import plugin from "@tailwindcss/typography";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const tseslint = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default tseslint.config({
  extends: [
    "next/core-web-vitals",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
    "plugin:tailwindcss/recommended"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn"
  },
  plugins: ["tailwindcss"],
  settings: {
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true,
        "project": "./tsconfig.json"
      }
    }
  },
  ignorePatterns: ["**/components/ui/**"]
});