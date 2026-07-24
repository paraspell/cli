import path from 'node:path';
import type { TFramework, TPackageManager } from './types.js';

export const printNextSteps = (
  outDir: string,
  pm: TPackageManager,
  framework: TFramework,
): void => {
  const cdPath = path.isAbsolute(outDir)
    ? outDir
    : path.relative(process.cwd(), outDir) || path.basename(outDir);
  console.log(`\nNext steps:\n  cd ${cdPath}\n  ${pm} install`);
  if (framework !== 'node') {
    console.log(`  ${pm} run dev`);
  } else {
    console.log(`  ${pm} start`);
  }
};
