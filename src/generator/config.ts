import type {
  TFramework,
  TProjectType,
  TSdkClient,
} from '../shared/project-options.js';
import type { TGeneratorTarget, TSdkPackage } from './types.js';

export const GENERATOR_TARGETS: Record<
  TProjectType,
  Record<TFramework, TGeneratorTarget>
> = {
  sdk: {
    react: {
      templateSet: 'xcm-sdk-react',
      logoFile: 'paraspell.png',
    },
    vue: {
      templateSet: 'xcm-sdk-vue',
      logoFile: 'paraspell.png',
    },
    node: {
      templateSet: 'xcm-sdk-node',
    },
  },
  api: {
    react: {
      templateSet: 'xcm-api-react',
      logoFile: 'lightspell.png',
    },
    vue: {
      templateSet: 'xcm-api-vue',
      logoFile: 'lightspell.png',
    },
    node: {
      templateSet: 'xcm-api-node',
    },
  },
};

export const SDK_PACKAGE_BY_CLIENT: Record<TSdkClient, TSdkPackage> = {
  papi: '@paraspell/sdk',
  pjs: '@paraspell/sdk-pjs',
  dedot: '@paraspell/sdk-dedot',
};

export const PNPM_ALLOWED_BUILDS: readonly string[] = [
  'bufferutil',
  'es5-ext',
  'esbuild',
  'utf-8-validate',
];
