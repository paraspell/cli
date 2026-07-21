export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export function normalizePackageManager(
  value: string | undefined,
): PackageManager;

export function resolvePackageManager(input: string | undefined): {
  packageManager: PackageManager;
  installCmd: string;
  devCmd: string;
  startCmd: string;
};
