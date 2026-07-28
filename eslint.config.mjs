// @ts-check

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default defineConfig({
  name: 'create-paraspell/typescript',
  files: ['src/**/*.ts', 'e2e/**/*.ts'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    eslintConfigPrettier,
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  linterOptions: {
    reportUnusedDisableDirectives: 'error',
  },
});
