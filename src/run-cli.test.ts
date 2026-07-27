import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { intro } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInteractiveGenerate } from './interactive.js';
import { runCli, runFromArgv } from './run-cli.js';
import { SDK_CLIENTS } from './shared/project-options.js';
import { runProjectFlow } from './shared/project-flow.js';

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
        '--extensions',
        'evm,swap',
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
      extensions: { evm: true, swap: true, snowbridge: false },
    });
    expect(options?.resolveOut('example')).toBe(path.join(root, 'custom'));
    expect(options?.interactive).toBe(false);
  });

  it.each(SDK_CLIENTS)('accepts the lowercase %s client', async (client) => {
    await runFromArgv(['sdk', '--client', client], {
      root: temporaryRoot(),
    });

    const options = vi.mocked(runProjectFlow).mock.calls[0]?.[0];
    expect(options?.input.client).toBe(client);
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
    expect(options?.resolveOut('example')).toBe(
      path.join(root, 'generated', 'xcm-api', 'react', 'example'),
    );
    expect(options?.userFacing).toBe(false);
  });

  it('uses an explicit output directory for internal generation', async () => {
    const root = temporaryRoot();

    await runFromArgv(
      [
        'api',
        '--name',
        'example',
        '--package-manager',
        'pnpm',
        '--out',
        'custom',
      ],
      { root },
    );

    const options = vi.mocked(runProjectFlow).mock.calls[0]?.[0];
    expect(options?.resolveOut('example')).toBe(path.join(root, 'custom'));
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
    expect(
      options?.validateTarget?.('available', path.join(root, 'available')),
    ).toBe(true);

    fs.mkdirSync(path.join(root, 'taken'));
    expect(
      options?.validateTarget?.('taken', path.join(root, 'taken')),
    ).toContain('Project already exists');
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
