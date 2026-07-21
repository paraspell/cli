import path from 'node:path';
import { createRequire } from 'node:module';
import { getPackageRoot } from '../package-root.js';
export { PACKAGE_MANAGERS } from './types.js';

type PackageManagerModule = typeof import('../../shared/package-manager.cjs');

const require = createRequire(import.meta.url);
const packageRoot = getPackageRoot();

const { normalizePackageManager }: PackageManagerModule =
  require(path.join(packageRoot, 'shared/package-manager.cjs'));

export { normalizePackageManager };
