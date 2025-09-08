import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import tailwindcss from 'eslint-plugin-tailwindcss';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['**/components/ui/**/*']),
  {
    extends: fixupConfigRules(
      compat.extends(
        'next/core-web-vitals',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
        'plugin:tailwindcss/recommended',
      ),
    ),

    plugins: {
      tailwindcss: fixupPluginRules(tailwindcss),
    },

    settings: {
      // Tailwind CSS v4 ESLint plugin configuration
      // See: https://github.com/francoismassart/eslint-plugin-tailwindcss/blob/alpha/v4/README.md
      tailwindcss: {
        cssConfigPath: `${path.dirname(fileURLToPath(import.meta.url))}/app/globals.css`,
      },

      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/classnames-order': 'off',
    },
  },
]);
