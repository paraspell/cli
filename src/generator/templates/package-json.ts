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

type TPackageJsonBase = Pick<
  TPackageJson,
  'name' | 'private' | 'version' | 'type'
>;

const QUALITY_SCRIPTS = {
  lint: 'eslint . --max-warnings 0',
  'lint:fix': 'eslint . --fix',
  format: 'prettier . --write',
  'format:check': 'prettier . --check',
};

const QUALITY_DEPENDENCIES = dependencyVersions(
  '@eslint/js',
  'eslint',
  'eslint-config-prettier',
  'globals',
  'prettier',
  'typescript',
  'typescript-eslint',
);

const baseManifest = (context: TTemplateContext): TPackageJsonBase => ({
  name: context.projectName,
  private: true,
  version: '1.0.0',
  type: 'module',
});

const sdkClientDependencies = (
  context: TTemplateContext,
): Record<string, string> => {
  const isNode = context.framework === 'node';

  switch (context.client) {
    case 'papi':
      return dependencyVersions('@paraspell/descriptors', 'polkadot-api');
    case 'pjs':
      return isNode
        ? dependencyVersions(
            '@polkadot/api',
            '@polkadot/types',
            '@polkadot/util',
          )
        : dependencyVersions('@polkadot/api', '@polkadot/extension-dapp');
    case 'dedot':
      return isNode
        ? dependencyVersions('dedot')
        : dependencyVersions(
            'dedot',
            '@polkadot/api',
            '@polkadot/extension-dapp',
          );
  }
};

const sdkDependencies = (context: TTemplateContext): Record<string, string> => {
  const {
    framework,
    sdkPackage,
    extensions: { evm, snowbridge, swap },
    evmWallet,
  } = context;

  return {
    ...dependencyVersions(sdkPackage),
    ...sdkClientDependencies(context),
    ...(swap ? dependencyVersions('@paraspell/swap') : {}),
    ...(evm ? dependencyVersions('@paraspell/evm') : {}),
    ...(snowbridge ? dependencyVersions('@paraspell/evm-snowbridge') : {}),
    ...(evmWallet
      ? framework === 'node'
        ? dependencyVersions('viem')
        : dependencyVersions('mipd', 'viem')
      : {}),
  };
};

const browserManifest = (context: TTemplateContext): TPackageJson => {
  const isReact = context.framework === 'react';
  const isSdk = context.projectKind === 'sdk';

  return {
    ...baseManifest(context),
    scripts: {
      dev: 'vite',
      build: isReact
        ? 'tsc -b && vite build'
        : 'vue-tsc --noEmit && vite build',
      compile: isReact ? 'tsc -b --noEmit' : 'vue-tsc --noEmit',
      ...QUALITY_SCRIPTS,
      preview: 'vite preview',
    },
    dependencies: {
      ...(isSdk
        ? sdkDependencies(context)
        : {
            ...dependencyVersions('axios', 'polkadot-api'),
            ...(context.evmWallet ? dependencyVersions('mipd', 'viem') : {}),
          }),
      ...(isReact
        ? dependencyVersions('react', 'react-dom')
        : dependencyVersions('vue')),
    },
    devDependencies: {
      ...QUALITY_DEPENDENCIES,
      ...dependencyVersions('@types/node', 'vite'),
      ...(isReact
        ? dependencyVersions(
            '@types/react',
            '@types/react-dom',
            '@vitejs/plugin-react',
            'eslint-plugin-react-hooks',
            'eslint-plugin-react-refresh',
          )
        : dependencyVersions(
            '@vitejs/plugin-vue',
            '@vue/tsconfig',
            'eslint-plugin-vue',
            'vue-eslint-parser',
            'vue-tsc',
          )),
      ...(isSdk ? dependencyVersions('vite-plugin-wasm') : {}),
    },
  };
};

const nodeManifest = (context: TTemplateContext): TPackageJson => {
  const isSdk = context.projectKind === 'sdk';

  return {
    ...baseManifest(context),
    scripts: {
      start: 'tsx src/index.ts',
      build: 'tsc',
      compile: 'tsc --noEmit',
      ...QUALITY_SCRIPTS,
    },
    dependencies: {
      ...(isSdk
        ? sdkDependencies(context)
        : dependencyVersions('axios', 'polkadot-api')),
      ...dependencyVersions('@polkadot/keyring', 'dotenv', 'express'),
      ...(!isSdk && context.evmWallet ? dependencyVersions('viem') : {}),
    },
    devDependencies: {
      ...QUALITY_DEPENDENCIES,
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
