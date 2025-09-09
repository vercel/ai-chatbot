import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  // import.meta.dirname requires Node.js >= 20.11
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  { ignores: ['**/components/ui/**/*', '**/.next/**'] },
  ...compat.config({
    extends: [
      'next',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:tailwindcss/recommended',
      'prettier',
    ],
    settings: {
      next: {
        rootDir: '.',
      },
      tailwindcss: {
        // Tailwind CSS v4 plugin config: point at our CSS entry
        cssConfigPath: './app/globals.css',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {},
  }),
];

export default eslintConfig;
