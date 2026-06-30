import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function runGenerateAll(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(cliRoot, 'node_modules/tsx/dist/cli.mjs'), 'src/tests/generate-all.ts'],
      {
        cwd: cliRoot,
        stdio: 'inherit',
        env: process.env,
      },
    );

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`generate-all.ts exited with code ${code ?? 'unknown'}`));
    });
    child.on('error', reject);
  });
}

export default async function globalSetup(): Promise<void> {
  if (process.env.SKIP_GENERATE === '1') {
    return;
  }
  await runGenerateAll();
}
