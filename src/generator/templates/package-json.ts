import type { TTemplateContext } from '../types.js';
import { dependencyVersions } from '../versions.js';

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

const qualityDependencies = (): Record<string, string> =>
  dependencyVersions(
    '@eslint/js',
    'eslint',
    'eslint-config-prettier',
    'globals',
    'prettier',
    'typescript',
    'typescript-eslint',
  );

const sdkDependencies = (context: TTemplateContext): Record<string, string> => {
  const {
    client,
    framework,
    sdkPackage,
    extensions: { evm, snowbridge, swap },
    evmWallet,
  } = context;

  return {
    ...dependencyVersions(sdkPackage),
    ...(client === 'papi' ? dependencyVersions('@paraspell/descriptors') : {}),
    ...(swap ? dependencyVersions('@paraspell/swap') : {}),
    ...(evm ? dependencyVersions('@paraspell/evm') : {}),
    ...(snowbridge ? dependencyVersions('@paraspell/evm-snowbridge') : {}),
    ...(evmWallet
      ? framework === 'node'
        ? dependencyVersions('viem')
        : dependencyVersions('mipd', 'viem')
      : {}),
    ...(client === 'papi' ? dependencyVersions('polkadot-api') : {}),
    ...(client === 'pjs'
      ? framework === 'node'
        ? dependencyVersions(
            '@polkadot/api',
            '@polkadot/types',
            '@polkadot/util',
          )
        : dependencyVersions('@polkadot/api', '@polkadot/extension-dapp')
      : {}),
    ...(client === 'dedot'
      ? framework === 'node'
        ? dependencyVersions('dedot')
        : dependencyVersions(
            'dedot',
            '@polkadot/api',
            '@polkadot/extension-dapp',
          )
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
            ...dependencyVersions('axios', 'polkadot-api'),
            ...(context.evmWallet ? dependencyVersions('mipd', 'viem') : {}),
          }),
      ...(react ? {} : dependencyVersions('vue')),
    },
    devDependencies: {
      ...qualityDependencies(),
      ...dependencyVersions('vite'),
      ...(react
        ? dependencyVersions(
            '@types/react',
            '@types/react-dom',
            '@vitejs/plugin-react',
            'eslint-plugin-react-hooks',
            'eslint-plugin-react-refresh',
            'react',
            'react-dom',
          )
        : dependencyVersions(
            '@vitejs/plugin-vue',
            'eslint-plugin-vue',
            'vue-eslint-parser',
            'vue-tsc',
          )),
      ...(sdk ? dependencyVersions('vite-plugin-wasm') : {}),
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
        : dependencyVersions('axios', 'polkadot-api')),
      ...dependencyVersions('@polkadot/keyring', 'dotenv', 'express'),
      ...(!sdk && context.evmWallet ? dependencyVersions('viem') : {}),
    },
    devDependencies: {
      ...qualityDependencies(),
      ...dependencyVersions('@types/express', '@types/node', 'tsx'),
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
