import path from 'node:path';
import { createRequire } from 'node:module';
import { getPackageRoot } from '../package-root.js';
import type { FeatureFlags } from './types.js';

type FeatureFlagsModule = typeof import('../../shared/feature-flags.cjs');

const require = createRequire(import.meta.url);
const packageRoot = getPackageRoot();

const { resolveFeatureFlags }: Pick<FeatureFlagsModule, 'resolveFeatureFlags'> =
  require(path.join(packageRoot, 'shared/feature-flags.cjs'));

export { resolveFeatureFlags };

export type ResolvedFeatureFlags = FeatureFlags & { evmWallet: boolean };

export function applyFeatureFlags<T extends FeatureFlags>(
  opts: T,
): T & { evmWallet: boolean } {
  const flags = resolveFeatureFlags(opts);
  return { ...opts, ...flags };
}
