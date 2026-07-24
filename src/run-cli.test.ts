import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TGenerateApp = typeof import('./generator/generate.js').generateApp;
type TRunInteractive = typeof import('./interactive.js').runInteractiveGenerate;
type TPromptGenerateOptions =
  typeof import('./shared/prompt-options.js').promptGenerateOptions;

const generateApp = vi.fn<TGenerateApp>();
const runInteractiveGenerate = vi.fn<TRunInteractive>();
const promptGenerateOptions = vi.fn<TPromptGenerateOptions>();

vi.mock('./generator/generate.js', () => ({
  generateApp: (params: Parameters<TGenerateApp>[0]) => generateApp(params),
}));

vi.mock('./interactive.js', () => ({
  runInteractiveGenerate: () => runInteractiveGenerate(),
}));

vi.mock('./shared/prompt-options.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./shared/prompt-options.js')>();
  return {
    ...actual,
    promptGenerateOptions: (
      input: Parameters<TPromptGenerateOptions>[0],
      options?: Parameters<TPromptGenerateOptions>[1],
    ) => promptGenerateOptions(input, options),
  };
});

const { runCli, runFromArgv } = await import('./run-cli.js');

type TArgvContext = { root: string; consumer?: boolean };
const runSdkFromArgv = (argv: string[], ctx: TArgvContext) =>
  runFromArgv(['sdk', ...argv], ctx);
const runApiFromArgv = (argv: string[], ctx: TArgvContext) =>
  runFromArgv(['api', ...argv], ctx);

const consumerCtx = (root: string) => {
  return { root, consumer: true as const };
};

const devCtx = (root: string) => {
  return { root };
};

const SDK_FLAGS = [
  'react',
  '--name',
  'my-app',
  '--package-manager',
  'npm',
  '--client',
  'pjs',
  '--evm',
] as const;

const stubTty = (isTTY: boolean): void => {
  vi.stubGlobal('process', {
    ...process,
    stdin: { isTTY },
    exitCode: undefined,
  });
};

const capturedText = (mock: { mock: { calls: unknown[][] } }): string => {
  return mock.mock.calls.map((call) => String(call[0])).join('');
};

describe('runSdkFromArgv', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-run-cli-'));
    vi.clearAllMocks();
    generateApp.mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    stubTty(false);
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('generates a sdk app from positional framework and flags', async () => {
    await runSdkFromArgv([...SDK_FLAGS], consumerCtx(tmpRoot));

    expect(promptGenerateOptions).not.toHaveBeenCalled();
    expect(generateApp).toHaveBeenCalledOnce();
    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      kind: 'sdk',
      opts: {
        framework: 'react',
        name: 'my-app',
        client: 'pjs',
        packageManager: 'npm',
        extensions: { evm: true },
        out: path.join(tmpRoot, 'my-app'),
      },
    });
  });

  it('uses --out instead of cwd/name in consumer mode', async () => {
    const outDir = path.join(tmpRoot, 'custom-out');
    await runSdkFromArgv([...SDK_FLAGS, '--out', outDir], consumerCtx(tmpRoot));

    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      opts: { out: outDir },
    });
  });

  it('uses the dev default out path when consumer mode is disabled', async () => {
    await runSdkFromArgv([...SDK_FLAGS], devCtx(tmpRoot));

    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      opts: {
        name: 'my-app',
        out: path.join(tmpRoot, 'generated', 'xcm-sdk', 'react', 'my-app'),
      },
    });
  });

  it('prints next steps in consumer mode', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runSdkFromArgv([...SDK_FLAGS], consumerCtx(tmpRoot));

    const printed = log.mock.calls.map(([line]) => String(line)).join('\n');
    expect(printed).toContain('Next steps:');
    expect(printed).toContain('npm install');
  });

  it('reports an error and skips generation when the target exists', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    await runSdkFromArgv([...SDK_FLAGS], consumerCtx(tmpRoot));

    expect(generateApp).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(capturedText(stderr)).toContain('Project already exists');
  });

  it('prints sdk help and skips generation for --help', async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await runSdkFromArgv(['react', '--help'], consumerCtx(tmpRoot));

    expect(capturedText(stdout)).toContain('create-paraspell sdk');
    expect(generateApp).not.toHaveBeenCalled();
  });

  it('prompts for missing options when stdin is a TTY', async () => {
    stubTty(true);
    promptGenerateOptions.mockResolvedValue({
      name: 'prompted-app',
      client: 'pjs',
      extensions: { evm: false, swap: false, snowbridge: false },
      packageManager: 'pnpm',
    });

    await runSdkFromArgv(['react'], consumerCtx(tmpRoot));

    expect(promptGenerateOptions).toHaveBeenCalledOnce();
    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      opts: { name: 'prompted-app' },
    });
  });

  it('reports invalid CLI secrets and skips generation without a TTY', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    await runSdkFromArgv(
      [
        'node',
        '--name',
        'node-app',
        '--package-manager',
        'pnpm',
        '--client',
        'papi',
        '--evm',
        '--private-key',
        'incorrect',
        '--substrate-mnemonic',
        'bad-mnemonic',
      ],
      consumerCtx(tmpRoot),
    );

    expect(promptGenerateOptions).not.toHaveBeenCalled();
    expect(generateApp).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(capturedText(stderr)).toContain(
      'Invalid --private-key or --substrate-mnemonic',
    );
  });

  it('prompts for secrets when invalid CLI secrets are passed on a TTY', async () => {
    stubTty(true);
    promptGenerateOptions.mockResolvedValue({
      name: 'node-app',
      client: 'papi',
      extensions: { evm: true, swap: false, snowbridge: false },
      packageManager: 'pnpm',
      substrateMnemonic: '//Alice',
      privateKey:
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    });

    await runSdkFromArgv(
      [
        'node',
        '--name',
        'node-app',
        '--package-manager',
        'pnpm',
        '--client',
        'papi',
        '--evm',
        '--private-key',
        'incorrect',
        '--substrate-mnemonic',
        'wrong',
      ],
      consumerCtx(tmpRoot),
    );

    expect(promptGenerateOptions).toHaveBeenCalledOnce();
    expect(generateApp).toHaveBeenCalledOnce();
  });
});

describe('runApiFromArgv', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-run-cli-'));
    vi.clearAllMocks();
    generateApp.mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    stubTty(false);
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('generates an api app with consumer out resolution', async () => {
    await runApiFromArgv(
      ['node', '--name', 'api-app', '--package-manager', 'npm', '--evm'],
      consumerCtx(tmpRoot),
    );

    expect(generateApp).toHaveBeenCalledOnce();
    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      kind: 'api',
      opts: {
        framework: 'node',
        name: 'api-app',
        out: path.join(tmpRoot, 'api-app'),
      },
    });
  });
});

describe('runCli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runInteractiveGenerate.mockResolvedValue(undefined);
    generateApp.mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    stubTty(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('delegates empty argv to the interactive wizard', async () => {
    await runCli([]);
    expect(runInteractiveGenerate).toHaveBeenCalledWith();
  });

  it('prints root help to stdout for --help', async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await runCli(['--help']);

    expect(capturedText(stdout)).toContain('create-paraspell');
    expect(runInteractiveGenerate).not.toHaveBeenCalled();
  });

  it('reports an unknown command for orphan flags', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    await runCli(['--name', 'orphan']);

    expect(generateApp).not.toHaveBeenCalled();
    expect(runInteractiveGenerate).not.toHaveBeenCalled();
    expect(capturedText(stderr)).toContain('No command registered');
  });

  it('routes sdk subcommands through consumer generation', async () => {
    const tmpRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'paraspell-run-cli-'),
    );
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(tmpRoot);

    try {
      await runCli(['sdk', ...SDK_FLAGS]);
      expect(generateApp).toHaveBeenCalledOnce();
      expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
        kind: 'sdk',
        opts: { out: path.join(tmpRoot, 'my-app') },
      });
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
      cwd.mockRestore();
    }
  });
});
