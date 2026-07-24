import { spawn } from 'node:child_process';
import type { TPackageManager } from './project-options.js';

export type TInstallResult = {
  ok: boolean;
  output: string;
};

const MAX_OUTPUT_LENGTH = 16_000;

export const installDependencies = (
  projectDir: string,
  packageManager: TPackageManager,
): Promise<TInstallResult> => {
  return new Promise((resolve) => {
    const child = spawn(packageManager, ['install'], {
      cwd: projectDir,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let settled = false;

    const append = (chunk: Buffer): void => {
      output += chunk.toString();
      if (output.length > MAX_OUTPUT_LENGTH) {
        output = output.slice(-MAX_OUTPUT_LENGTH);
      }
    };

    const finish = (result: TInstallResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    child.stdout?.on('data', append);
    child.stderr?.on('data', append);
    child.on('error', (error) => {
      finish({ ok: false, output: `${output}\n${error.message}`.trim() });
    });
    child.on('close', (code) => {
      finish({ ok: code === 0, output });
    });
  });
};
