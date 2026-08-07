import { PNPM_ALLOWED_BUILDS } from '../config.js';
import type { TTemplateContext, TTemplateFile } from '../types.js';
import { source } from './source.js';

const pnpmAllowedBuilds = PNPM_ALLOWED_BUILDS.map(
  (dependency) => `  ${dependency}: true`,
).join('\n');

const pnpmWorkspace = `allowBuilds:
${pnpmAllowedBuilds}
`;

const renderReactEslintConfig = () => source`
  import js from "@eslint/js";
  import eslintConfigPrettier from "eslint-config-prettier/flat";
  import globals from "globals";
  import reactHooks from "eslint-plugin-react-hooks";
  import reactRefresh from "eslint-plugin-react-refresh";
  import tseslint from "typescript-eslint";

  export default tseslint.config(
    { ignores: ["dist"] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        ecmaVersion: 2023,
        globals: globals.browser,
      },
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
          "warn",
          { allowConstantExport: true },
        ],
      },
    },
    eslintConfigPrettier,
  );
`;

const renderVueEslintConfig = () => source`
  import js from "@eslint/js";
  import eslintConfigPrettier from "eslint-config-prettier/flat";
  import globals from "globals";
  import tseslint from "typescript-eslint";
  import pluginVue from "eslint-plugin-vue";
  import vueParser from "vue-eslint-parser";

  export default tseslint.config(
    { ignores: ["dist"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs["flat/recommended"],
    {
      files: ["**/*.{ts,vue}"],
      languageOptions: {
        ecmaVersion: 2023,
        globals: globals.browser,
      },
    },
    {
      files: ["**/*.vue"],
      languageOptions: {
        parser: vueParser,
        parserOptions: {
          parser: tseslint.parser,
          extraFileExtensions: [".vue"],
        },
      },
    },
    eslintConfigPrettier,
  );
`;

const renderNodeEslintConfig = () => source`
  import js from "@eslint/js";
  import eslintConfigPrettier from "eslint-config-prettier/flat";
  import globals from "globals";
  import tseslint from "typescript-eslint";

  export default tseslint.config(
    { ignores: ["dist"] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ["**/*.ts"],
      languageOptions: {
        ecmaVersion: 2023,
        globals: globals.node,
      },
    },
    eslintConfigPrettier,
  );
`;

const ESLINT_CONFIG_RENDERERS = {
  react: renderReactEslintConfig,
  vue: renderVueEslintConfig,
  node: renderNodeEslintConfig,
};

export const createQualityTemplates = (
  context: TTemplateContext,
): readonly TTemplateFile[] => [
  {
    path: 'eslint.config.js',
    render: ESLINT_CONFIG_RENDERERS[context.framework],
  },
  {
    path: '.prettierrc.json',
    render: () => source`{
      "singleQuote": false
    }
    `,
  },
  {
    path: '.prettierignore',
    render: () => source`dist
      node_modules
    `,
  },
  {
    path: 'pnpm-workspace.yaml',
    skip: context.packageManager !== 'pnpm',
    render: () => pnpmWorkspace,
  },
];
