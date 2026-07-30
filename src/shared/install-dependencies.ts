import { spawn } from 'node:child_process';
import { once } from 'node:events';
import type { TPackageManager } from './project-options.js';

export type TInstallResult = {
  ok: boolean;
  output: string;
};

const MAX_OUTPUT_LENGTH = 16_000;

export const installDependencies = async (
  projectDir: string,
  packageManager: TPackageManager,
): Promise<TInstallResult> => {
  const child = spawn(packageManager, ['install'], {
    cwd: projectDir,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';

  const append = (chunk: Buffer): void => {
    output += chunk.toString();
    if (output.length > MAX_OUTPUT_LENGTH) {
      output = output.slice(-MAX_OUTPUT_LENGTH);
    }
  };

  child.stdout?.on('data', append);
  child.stderr?.on('data', append);

  try {
    const closeEvent: unknown = await once(child, 'close');
    return {
      ok: Array.isArray(closeEvent) && closeEvent[0] === 0,
      output,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: `${output}\n${message}`.trim() };
  }
};
