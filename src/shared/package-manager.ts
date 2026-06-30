import path from 'node:path';
import { createRequire } from 'node:module';
import { getPackageRoot } from '../package-root.js';
export type { PackageManager } from './types.js';

type PackageManagerModule = typeof import('../../shared/package-manager.cjs');

const require = createRequire(import.meta.url);
const packageRoot = getPackageRoot();

const { PACKAGE_MANAGERS, normalizePackageManager }: PackageManagerModule =
  require(path.join(packageRoot, 'shared/package-manager.cjs'));

export { PACKAGE_MANAGERS, normalizePackageManager };
