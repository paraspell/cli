import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { intro } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInteractiveGenerate } from './interactive.js';
import { runCli, runFromArgv } from './run-cli.js';
import { runProjectFlow } from './shared/project-flow.js';
import type { TResolvedOptions } from './shared/types.js';

vi.mock('@clack/prompts');
vi.mock('./interactive.js');
vi.mock('./shared/project-flow.js');

const outputs: string[] = [];
const isTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');

const temporaryRoot = (): string => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-cli-'));
  outputs.push(output);
  return output;
};

const resolved: TResolvedOptions = {
  name: 'example',
  client: 'papi',
  packageManager: 'pnpm',
  extensions: { evm: false, swap: false, snowbridge: false },
  privateKey: undefined,
  substrateMnemonic: undefined,
};

describe('CLI routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runProjectFlow).mockResolvedValue();
    vi.mocked(runInteractiveGenerate).mockResolvedValue();
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    process.exitCode = undefined;

    if (isTtyDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', isTtyDescriptor);
    } else {
      Reflect.deleteProperty(process.stdin, 'isTTY');
    }

    vi.restoreAllMocks();
    for (const output of outputs.splice(0)) {
      fs.rmSync(output, { recursive: true, force: true });
    }
  });

  it('routes SDK flags into a consumer project flow', async () => {
    const root = temporaryRoot();

    await runFromArgv(
      [
        'sdk',
        'react',
        '--name',
        'example',
        '--package-manager',
        'npm',
        '--client',
        'pjs',
        '--evm',
        '--out',
        'custom',
      ],
      { root, consumer: true },
    );

    const options = vi.mocked(runProjectFlow).mock.calls[0]?.[0];
    expect(options?.input).toMatchObject({
      kind: 'sdk',
      framework: 'react',
      name: 'example',
      client: 'pjs',
      packageManager: 'npm',
      extensions: { evm: true },
    });
    expect(options?.resolveOut(resolved)).toBe(path.join(root, 'custom'));
    expect(options?.interactive).toBe(false);
  });

  it('uses internal defaults for API generation', async () => {
    const root = temporaryRoot();

    await runFromArgv(
      ['api', '--name', 'example', '--package-manager', 'pnpm'],
      { root },
    );

    const options = vi.mocked(runProjectFlow).mock.calls[0]?.[0];
    expect(options?.input).toMatchObject({
      kind: 'api',
      framework: 'react',
      client: undefined,
    });
    expect(options?.resolveOut(resolved)).toBe(
      path.join(root, 'generated', 'xcm-api', 'react', 'example'),
    );
    expect(options?.userFacing).toBe(false);
  });

  it('provides consumer validation and interactive presentation', async () => {
    const root = temporaryRoot();
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    });

    await runFromArgv(['sdk', 'vue', '--name', 'example'], {
      root,
      consumer: true,
    });

    const options = vi.mocked(runProjectFlow).mock.calls[0]?.[0];
    expect(intro).toHaveBeenCalled();
    expect(options?.interactive).toBe(true);
    expect(options?.validateName?.('available')).toBe(true);

    fs.mkdirSync(path.join(root, 'taken'));
    expect(options?.validateName?.('taken')).toContain(
      'Project already exists',
    );
    expect(() =>
      options?.validateOutput?.('taken', path.join(root, 'taken')),
    ).toThrow('Project already exists');
  });

  it('runs the interactive wizard for empty arguments', async () => {
    await runCli([]);
    expect(runInteractiveGenerate).toHaveBeenCalledOnce();
  });

  it('prints help without starting a flow', async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await runCli(['--help']);

    expect(stdout).toHaveBeenCalled();
    expect(runProjectFlow).not.toHaveBeenCalled();
  });
});
