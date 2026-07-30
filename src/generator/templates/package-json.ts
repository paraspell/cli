import type { TTemplateContext } from '../types.js';

type TPackageJson = {
  name: string;
  private: true;
  version: string;
  type: 'module';
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

const qualityScripts = {
  lint: 'eslint . --max-warnings 0',
  'lint:fix': 'eslint . --fix',
  format: 'prettier . --write',
  'format:check': 'prettier . --check',
};

const qualityDependencies = (context: TTemplateContext) => ({
  '@eslint/js': context.eslintJs,
  eslint: context.eslint,
  'eslint-config-prettier': context.eslintConfigPrettier,
  globals: context.globals,
  prettier: context.prettier,
  typescript: context.typescript,
  'typescript-eslint': context.typescriptEslint,
});

const sdkDependencies = (context: TTemplateContext): Record<string, string> => {
  const {
    client,
    framework,
    sdkPackage,
    sdkVersion,
    extensions: { evm, snowbridge, swap },
    evmWallet,
  } = context;

  return {
    [sdkPackage]: sdkVersion,
    ...(client === 'papi' ? { '@paraspell/descriptors': sdkVersion } : {}),
    ...(swap ? { '@paraspell/swap': sdkVersion } : {}),
    ...(evm ? { '@paraspell/evm': sdkVersion } : {}),
    ...(snowbridge ? { '@paraspell/evm-snowbridge': sdkVersion } : {}),
    ...(evmWallet
      ? framework === 'node'
        ? { viem: context.viem }
        : { mipd: context.mipd, viem: context.viem }
      : {}),
    ...(client === 'papi' ? { 'polkadot-api': context.polkadotApi } : {}),
    ...(client === 'pjs'
      ? framework === 'node'
        ? {
            '@polkadot/api': context.polkadotJsApi,
            '@polkadot/types': context.polkadotJsApi,
            '@polkadot/util': context.polkadotUtil,
          }
        : {
            '@polkadot/api': context.polkadotJsApi,
            '@polkadot/extension-dapp': context.polkadotExtensionDapp,
          }
      : {}),
    ...(client === 'dedot'
      ? framework === 'node'
        ? { dedot: context.dedot }
        : {
            dedot: context.dedot,
            '@polkadot/api': context.polkadotJsApi,
            '@polkadot/extension-dapp': context.polkadotExtensionDapp,
          }
      : {}),
  };
};

const browserManifest = (context: TTemplateContext): TPackageJson => {
  const react = context.framework === 'react';
  const sdk = context.projectKind === 'sdk';

  return {
    name: context.projectName,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: react ? 'tsc -b && vite build' : 'vue-tsc --noEmit && vite build',
      compile: react ? 'tsc -b --noEmit' : 'vue-tsc --noEmit',
      ...qualityScripts,
      preview: 'vite preview',
    },
    dependencies: {
      ...(sdk
        ? sdkDependencies(context)
        : {
            axios: context.axios,
            'polkadot-api': context.polkadotApi,
            ...(context.evmWallet
              ? { mipd: context.mipd, viem: context.viem }
              : {}),
          }),
      ...(react ? {} : { vue: context.vue }),
    },
    devDependencies: {
      ...qualityDependencies(context),
      vite: context.vite,
      ...(react
        ? {
            '@types/react': context.typesReact,
            '@types/react-dom': context.typesReactDom,
            '@vitejs/plugin-react': context.vitejsPluginReact,
            'eslint-plugin-react-hooks': context.eslintPluginReactHooks,
            'eslint-plugin-react-refresh': context.eslintPluginReactRefresh,
            react: context.react,
            'react-dom': context.reactDom,
          }
        : {
            '@vitejs/plugin-vue': context.vitejsPluginVue,
            'eslint-plugin-vue': context.eslintPluginVue,
            'vue-eslint-parser': context.vueEslintParser,
            'vue-tsc': context.vueTsc,
          }),
      ...(sdk ? { 'vite-plugin-wasm': context.vitePluginWasm } : {}),
    },
  };
};

const nodeManifest = (context: TTemplateContext): TPackageJson => {
  const sdk = context.projectKind === 'sdk';

  return {
    name: context.projectName,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'tsx src/index.ts',
      build: 'tsc',
      compile: 'tsc --noEmit',
      ...qualityScripts,
    },
    dependencies: {
      ...(sdk
        ? sdkDependencies(context)
        : {
            axios: context.axios,
            'polkadot-api': context.polkadotApi,
          }),
      '@polkadot/keyring': context.polkadotKeyring,
      dotenv: context.dotenv,
      express: context.express,
      ...(!sdk && context.evmWallet ? { viem: context.viem } : {}),
    },
    devDependencies: {
      ...qualityDependencies(context),
      '@types/express': context.typesExpress,
      '@types/node': context.typesNode,
      tsx: context.tsx,
    },
  };
};

export const renderPackageJson = (context: TTemplateContext): string => {
  const manifest =
    context.framework === 'node'
      ? nodeManifest(context)
      : browserManifest(context);
  return `${JSON.stringify(manifest, null, 2)}\n`;
};
