import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isPackageRoot = (dir: string): boolean => {
  return (
    fs.existsSync(path.join(dir, '_templates')) &&
    fs.existsSync(path.join(dir, 'shared', 'feature-flags.cjs'))
  );
};

export const getPackageRoot = (fromModuleUrl = import.meta.url): string => {
  let dir = path.dirname(fileURLToPath(fromModuleUrl));

  while (true) {
    if (isPackageRoot(dir)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        'Could not find the create-paraspell package root (a directory ' +
          'containing both _templates/ and shared/feature-flags.cjs).',
      );
    }
    dir = parent;
  }
};
