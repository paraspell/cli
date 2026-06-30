import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from './run-project.js';

export const WORKSPACE_INSTALL_TIMEOUT_MS = 20 * 60 * 1000;

const cliRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function getGeneratedRoot(): string {
  return path.join(cliRoot, 'generated');
}

const GENERATED_WORKSPACE_PACKAGE = {
  name: 'paraspell-generated-workspace',
  private: true,
  pnpm: {
    // polkadot-api (papi) and @polkadot/api (snowbridge) pull different versions of
    // @polkadot-api/json-rpc-provider-proxy; without this override Vite resolves
    // proxy@0.4.0 against provider@0.0.1 and fails during dependency optimization.
    overrides: {
      '@polkadot-api/json-rpc-provider': '0.2.0',
    },
  },
} as const;

export function writeGeneratedWorkspace(): void {
  const root = getGeneratedRoot();
  fs.mkdirSync(root, { recursive: true });

  fs.writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    "packages:\n  - 'xcm-sdk/*/*'\n  - 'xcm-api/*/*'\n",
  );

  fs.writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify(GENERATED_WORKSPACE_PACKAGE, null, 2)}\n`,
  );
}

export function isInGeneratedWorkspace(projectDir: string): boolean {
  const generatedRoot = getGeneratedRoot();
  return (
    projectDir.startsWith(`${generatedRoot}${path.sep}`)
    && fs.existsSync(path.join(generatedRoot, 'pnpm-workspace.yaml'))
  );
}

export function hasProjectDependencies(projectDir: string): boolean {
  return fs.existsSync(path.join(projectDir, 'node_modules'));
}

let installPromise: Promise<void> | undefined;

export function ensureGeneratedWorkspaceInstall(
  timeoutMs = WORKSPACE_INSTALL_TIMEOUT_MS,
): Promise<void> {
  if (process.env.SKIP_INSTALL === '1') {
    return Promise.resolve();
  }

  if (!installPromise) {
    installPromise = (async () => {
      writeGeneratedWorkspace();
      const result = await runCommand(
        getGeneratedRoot(),
        'pnpm',
        ['install'],
        timeoutMs,
      );
      if (!result.ok) {
        installPromise = undefined;
        throw new Error(`workspace install failed:\n${result.output}`);
      }
    })();
  }

  return installPromise;
}
