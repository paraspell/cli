import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { input, select } from '@inquirer/prompts';
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from './feature-extensions-checkbox.js';
import { promptApiOptions } from './prompt-api.js';
import { promptSdkOptions } from './prompt-sdk.js';
import { promptEvmPrivateKey } from './prompt-evm-private-key.js';
import { promptSubstrateMnemonic } from './prompt-substrate-mnemonic.js';

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  password: vi.fn(),
  Separator: class Separator {},
}));

vi.mock('./feature-extensions-checkbox.js', () => ({
  promptFeatureExtensions: vi.fn(),
  EVM_EXTENSION: 'evm',
  SWAP_EXTENSION: 'swap',
  SNOWBRIDGE_EXTENSION: 'snowbridge',
}));

vi.mock('./prompt-substrate-mnemonic.js', () => ({
  promptSubstrateMnemonic: vi.fn(),
}));

vi.mock('./prompt-evm-private-key.js', () => ({
  promptEvmPrivateKey: vi.fn(),
}));

const mockedInput = vi.mocked(input);
const mockedSelect = vi.mocked(select);
const mockedFeatureExtensions = vi.mocked(promptFeatureExtensions);
const mockedSubstrateMnemonic = vi.mocked(promptSubstrateMnemonic);
const mockedEvmPrivateKey = vi.mocked(promptEvmPrivateKey);

describe('promptSdkOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses CLI-provided values without calling Inquirer prompts', async () => {
    const result = await promptSdkOptions(
      {
        framework: 'react',
        name: 'my-app',
        packageManager: 'npm',
        client: 'papi',
        evm: true,
        swap: false,
        snowbridge: false,
      },
      {
        argv: [
          '--name',
          'my-app',
          '--package-manager',
          'npm',
          '--client',
          'papi',
          '--evm',
        ],
      },
    );

    expect(result).toEqual({
      name: 'my-app',
      client: 'papi',
      evm: true,
      swap: false,
      snowbridge: false,
      evmWallet: true,
      packageManager: 'npm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
    expect(mockedInput).not.toHaveBeenCalled();
    expect(mockedSelect).not.toHaveBeenCalled();
    expect(mockedFeatureExtensions).not.toHaveBeenCalled();
  });

  it('echoes CLI-provided answers before prompting for missing values', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedInput.mockResolvedValue('prompted-app');
    mockedSelect
      .mockResolvedValueOnce('yarn')
      .mockResolvedValueOnce('dedot');
    mockedFeatureExtensions.mockResolvedValue([EVM_EXTENSION]);

    const result = await promptSdkOptions(
      { framework: 'react', name: 'my-app' },
      { argv: ['--name', 'my-app'] },
    );

    expect(result.name).toBe('my-app');
    expect(result.packageManager).toBe('yarn');
    expect(result.client).toBe('dedot');
    expect(log.mock.calls.some(([line]) => String(line).includes('my-app'))).toBe(
      true,
    );
    expect(mockedInput).not.toHaveBeenCalled();
    expect(mockedSelect).toHaveBeenCalledTimes(2);
    expect(mockedFeatureExtensions).toHaveBeenCalledOnce();
  });

  it('prompts for node secrets when they are not provided via argv', async () => {
    mockedSubstrateMnemonic.mockResolvedValue('//Alice');
    mockedEvmPrivateKey.mockResolvedValue('0x1234');

    const result = await promptSdkOptions(
      { framework: 'node', evm: true, name: 'node-app' },
      {
        argv: [
          '--name',
          'node-app',
          '--package-manager',
          'pnpm',
          '--client',
          'pjs',
          '--evm',
        ],
      },
    );

    expect(result).toMatchObject({
      substrateMnemonic: '//Alice',
      privateKey: '0x1234',
    });
    expect(mockedSubstrateMnemonic).toHaveBeenCalledOnce();
    expect(mockedEvmPrivateKey).toHaveBeenCalledOnce();
  });

  it('prompts when value flags are present without values', async () => {
    mockedInput.mockResolvedValue('prompted-name');
    mockedSelect.mockResolvedValueOnce('pnpm').mockResolvedValueOnce('pjs');
    mockedFeatureExtensions.mockResolvedValue([]);

    const result = await promptSdkOptions(
      { framework: 'react' },
      { argv: ['--name', '--package-manager', '--client'] },
    );

    expect(result).toMatchObject({
      name: 'prompted-name',
      packageManager: 'pnpm',
      client: 'pjs',
    });
    expect(mockedInput).toHaveBeenCalledOnce();
    expect(mockedSelect).toHaveBeenCalledTimes(2);
  });

  it('prompts when --name has an invalid value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedInput.mockResolvedValue('valid-app');
    mockedSelect.mockResolvedValueOnce('pnpm').mockResolvedValueOnce('pjs');
    mockedFeatureExtensions.mockResolvedValue([]);

    const result = await promptSdkOptions(
      { framework: 'react', name: 'Invalid Name' },
      { argv: ['--name', 'Invalid Name', '--evm'] },
    );

    expect(result.name).toBe('valid-app');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/ignoring invalid --name/),
    );
    expect(mockedInput).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});

describe('promptApiOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses CLI-provided values without calling Inquirer prompts', async () => {
    const result = await promptApiOptions(
      {
        framework: 'react',
        name: 'api-app',
        packageManager: 'npm',
        evm: false,
        swap: true,
        snowbridge: false,
      },
      {
        argv: ['--name', 'api-app', '--package-manager', 'npm', '--swap'],
      },
    );

    expect(result).toEqual({
      name: 'api-app',
      evm: false,
      swap: true,
      snowbridge: false,
      evmWallet: false,
      packageManager: 'npm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
    expect(mockedInput).not.toHaveBeenCalled();
    expect(mockedSelect).not.toHaveBeenCalled();
    expect(mockedFeatureExtensions).not.toHaveBeenCalled();
  });

  it('prompts for missing values in a mixed CLI + interactive flow', async () => {
    mockedInput.mockResolvedValue('api-prompted');
    mockedSelect.mockResolvedValue('bun');
    mockedFeatureExtensions.mockResolvedValue([SNOWBRIDGE_EXTENSION]);

    const result = await promptApiOptions(
      { framework: 'vue' },
      { argv: [] },
    );

    expect(result).toMatchObject({
      name: 'api-prompted',
      packageManager: 'bun',
      evm: false,
      swap: false,
      snowbridge: true,
      evmWallet: true,
    });
    expect(mockedInput).toHaveBeenCalledOnce();
    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(mockedFeatureExtensions).toHaveBeenCalledOnce();
  });
});
