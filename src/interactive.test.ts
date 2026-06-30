import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { input, select } from '@inquirer/prompts';
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
} from './shared/feature-extensions-checkbox.js';
import { promptEvmPrivateKey } from './shared/prompt-evm-private-key.js';
import { promptSubstrateMnemonic } from './shared/prompt-substrate-mnemonic.js';

type GenerateSdkApp = typeof import('./shared/hygen-runner.js').generateSdkApp;
type GenerateApiApp = typeof import('./shared/hygen-runner.js').generateApiApp;

const generateSdkApp = vi.fn<GenerateSdkApp>();
const generateApiApp = vi.fn<GenerateApiApp>();

vi.mock('terminal-image', () => ({
  default: {
    buffer: vi.fn().mockResolvedValue(''),
  },
}));

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  Separator: class Separator {},
}));

vi.mock('./shared/feature-extensions-checkbox.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./shared/feature-extensions-checkbox.js')>();
  return {
    ...actual,
    promptFeatureExtensions: vi.fn(),
  };
});

vi.mock('./shared/prompt-substrate-mnemonic.js', () => ({
  promptSubstrateMnemonic: vi.fn(),
}));

vi.mock('./shared/prompt-evm-private-key.js', () => ({
  promptEvmPrivateKey: vi.fn(),
}));

vi.mock('./shared/hygen-runner.js', () => ({
  generateSdkApp: (params: Parameters<GenerateSdkApp>[0]) => generateSdkApp(params),
  generateApiApp: (params: Parameters<GenerateApiApp>[0]) => generateApiApp(params),
}));

const { runInteractiveGenerate } = await import('./interactive.js');

const mockedInput = vi.mocked(input);
const mockedSelect = vi.mocked(select);
const mockedFeatureExtensions = vi.mocked(promptFeatureExtensions);
const mockedSubstrateMnemonic = vi.mocked(promptSubstrateMnemonic);
const mockedEvmPrivateKey = vi.mocked(promptEvmPrivateKey);

const PROMPTS = {
  name: 'Enter the project name',
  packageManager: 'Select the desired package manager',
  framework: 'Select the desired framework',
  projectType: 'Select the desired project type',
  client: 'Select the desired JS client type',
} as const;

const TEMPLATES_ROOT = path.join(process.cwd(), '_templates');

function selectMessages(): string[] {
  return mockedSelect.mock.calls.map((call) => call[0]?.message);
}

function inputMessages(): string[] {
  return mockedInput.mock.calls.map((call) => call[0]?.message);
}

describe('runInteractiveGenerate', () => {
  let tmpRoot: string;
  let cwd: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-interactive-'));
    cwd = vi.spyOn(process, 'cwd').mockReturnValue(tmpRoot);
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    generateSdkApp.mockResolvedValue(undefined);
    generateApiApp.mockResolvedValue(undefined);
    mockedInput.mockResolvedValue('my-wizard-app');
    mockedFeatureExtensions.mockResolvedValue([]);
    mockedSubstrateMnemonic.mockResolvedValue(undefined);
    mockedEvmPrivateKey.mockResolvedValue(undefined);
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runs the sdk wizard prompts in order and generates the project', async () => {
    mockedSelect
      .mockResolvedValueOnce('pnpm')
      .mockResolvedValueOnce('react')
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('papi');

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runInteractiveGenerate(TEMPLATES_ROOT);

    expect(inputMessages()).toEqual([PROMPTS.name]);
    expect(selectMessages()).toEqual([
      PROMPTS.packageManager,
      PROMPTS.framework,
      PROMPTS.projectType,
      PROMPTS.client,
    ]);
    expect(mockedFeatureExtensions).toHaveBeenCalledOnce();
    expect(mockedSubstrateMnemonic).not.toHaveBeenCalled();
    expect(mockedEvmPrivateKey).not.toHaveBeenCalled();
    expect(generateSdkApp).toHaveBeenCalledOnce();
    expect(generateApiApp).not.toHaveBeenCalled();
    expect(generateSdkApp.mock.calls[0]?.[0]).toMatchObject({
      templatesRoot: TEMPLATES_ROOT,
      opts: {
        framework: 'react',
        name: 'my-wizard-app',
        client: 'papi',
        packageManager: 'pnpm',
        out: path.join(tmpRoot, 'my-wizard-app'),
        evm: false,
        swap: false,
        snowbridge: false,
      },
    });
    expect(log.mock.calls.some(([line]) => String(line).includes('Welcome to the Paraspell CLI'))).toBe(
      true,
    );
    expect(log.mock.calls.some(([line]) => String(line).includes('Next steps:'))).toBe(true);
  });

  it('skips the client prompt for api projects', async () => {
    mockedSelect
      .mockResolvedValueOnce('npm')
      .mockResolvedValueOnce('vue')
      .mockResolvedValueOnce('api');

    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runInteractiveGenerate(TEMPLATES_ROOT);

    expect(selectMessages()).toEqual([
      PROMPTS.packageManager,
      PROMPTS.framework,
      PROMPTS.projectType,
    ]);
    expect(generateApiApp).toHaveBeenCalledOnce();
    expect(generateSdkApp).not.toHaveBeenCalled();
    expect(generateApiApp.mock.calls[0]?.[0]).toMatchObject({
      opts: {
        framework: 'vue',
        name: 'my-wizard-app',
        packageManager: 'npm',
        out: path.join(tmpRoot, 'my-wizard-app'),
      },
    });
  });

  it('prompts for node secrets after feature selection when wallet origins are enabled', async () => {
    mockedSelect
      .mockResolvedValueOnce('pnpm')
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('pjs');
    mockedFeatureExtensions.mockResolvedValue([EVM_EXTENSION]);
    mockedSubstrateMnemonic.mockResolvedValue('//Alice');
    mockedEvmPrivateKey.mockResolvedValue('0xabc');

    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runInteractiveGenerate(TEMPLATES_ROOT);

    expect(selectMessages()).toEqual([
      PROMPTS.packageManager,
      PROMPTS.framework,
      PROMPTS.projectType,
      PROMPTS.client,
    ]);

    const stepNames = [
      ...inputMessages(),
      ...selectMessages(),
      'feature-extensions',
      'substrate-mnemonic',
      'evm-private-key',
    ];
    expect(stepNames).toEqual([
      PROMPTS.name,
      PROMPTS.packageManager,
      PROMPTS.framework,
      PROMPTS.projectType,
      PROMPTS.client,
      'feature-extensions',
      'substrate-mnemonic',
      'evm-private-key',
    ]);
    expect(mockedFeatureExtensions).toHaveBeenCalledOnce();
    expect(mockedSubstrateMnemonic).toHaveBeenCalledOnce();
    expect(mockedEvmPrivateKey).toHaveBeenCalledOnce();
    expect(generateSdkApp.mock.calls[0]?.[0]).toMatchObject({
      opts: {
        framework: 'node',
        evm: true,
        evmWallet: true,
        substrateMnemonic: '//Alice',
        privateKey: '0xabc',
      },
    });
  });
});
