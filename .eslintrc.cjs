/* Minimal ESLint config unified for TS/React/Tailwind */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.json'],
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'react',
    'react-hooks',
    'tailwindcss',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:tailwindcss/recommended',
    'next/core-web-vitals',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: './tsconfig.json', alwaysTryTypes: true },
    },
    tailwindcss: {
      callees: ['classnames', 'clsx', 'ctl'],
      config: 'tailwind.config.ts',
    },
  },
  ignorePatterns: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/storybook-static/**',
  ],
  rules: {
    'react/prop-types': 'off',
    'tailwindcss/no-custom-classname': 'off',
    // For Tailwind v3: discourage deprecated ring opacity utility
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/.*(?:^|\\s)focus:ring-opacity-50(?:$|\\s).*/]",
        message: 'Avoid focus:ring-opacity-50 (Tailwind v3)',
      },
      {
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/\\b(w|h)-(0|px|[0-9]+)\\b/]",
        message: 'Consider Tailwind size-* utilities where applicable',
      },
    ],
  },
};

