import type { TSdkClient } from '../shared/project-options.js';
import type { TSdkPackage } from './types.js';

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
