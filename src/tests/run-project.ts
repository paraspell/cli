import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  hasProjectDependencies,
  isInGeneratedWorkspace,
} from './workspace-install.js';

export type TPackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface TCommandStep {
  name: string;
  ok: boolean;
  output: string;
}

const detectPackageManager = (projectDir: string): TPackageManager => {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'),
    ) as { packageManager?: string };
    const pm = pkg.packageManager?.split('@')[0];
    if (pm === 'npm' || pm === 'yarn' || pm === 'pnpm' || pm === 'bun') {
      return pm;
    }
  } catch {
    /* fall through */
  }
  return 'pnpm';
};

const installArgs = (pm: TPackageManager): [string, string[]] => {
  switch (pm) {
    case 'npm':
      return ['npm', ['install', '--no-audit', '--no-fund']];
    case 'yarn':
      return ['yarn', ['install']];
    case 'bun':
      return ['bun', ['install']];
    default:
      return ['pnpm', ['install']];
  }
};

const runArgs = (pm: TPackageManager, script: string): [string, string[]] => {
  switch (pm) {
    case 'npm':
      return ['npm', ['run', script]];
    case 'yarn':
      return ['yarn', [script]];
    case 'bun':
      return ['bun', ['run', script]];
    default:
      return ['pnpm', ['run', script]];
  }
};

export const runCommand = (
  cwd: string,
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<{ ok: boolean; output: string }> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true' },
    });

    let output = '';
    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 32_000) {
        output = output.slice(-32_000);
      }
    };

    child.stdout?.on('data', append);
    child.stderr?.on('data', append);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      append(Buffer.from(`\n(timed out after ${timeoutMs}ms)\n`));
      resolve({ ok: false, output });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, output: `${output}\n${err.message}` });
    });
  });
};

export const installProject = async (
  projectDir: string,
  timeoutMs: number,
): Promise<{ pm: TPackageManager; step: TCommandStep }> => {
  const pm = detectPackageManager(projectDir);

  if (
    isInGeneratedWorkspace(projectDir) &&
    hasProjectDependencies(projectDir)
  ) {
    return {
      pm,
      step: {
        name: 'install',
        ok: true,
        output: '(skipped — workspace install)',
      },
    };
  }

  const [installCmd, installArgv] = installArgs(pm);
  const install = await runCommand(
    projectDir,
    installCmd,
    installArgv,
    timeoutMs,
  );
  return {
    pm,
    step: { name: 'install', ok: install.ok, output: install.output },
  };
};

export const runProjectScript = async (
  projectDir: string,
  pm: TPackageManager,
  script: string,
  timeoutMs: number,
): Promise<TCommandStep> => {
  const [cmd, argv] = runArgs(pm, script);
  const result = await runCommand(projectDir, cmd, argv, timeoutMs);
  return { name: script, ok: result.ok, output: result.output };
};
