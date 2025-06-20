import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const tseslint = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default tseslint.config({
  rules: {
    "@typescript-eslint/no-explicit-any": "warn"
  }
});