import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, text } from '@clack/prompts';
import {
  applyGenerateDefaults,
  hasRejectedSecrets,
  promptGenerateOptions,
} from './prompt-options.js';

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  select: vi.fn(),
  log: { success: vi.fn() },
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock('./feature-extensions-checkbox.js', () => ({
  EVM_EXTENSION: 'evm-extension',
  SWAP_EXTENSION: 'swap-extension',
  SNOWBRIDGE_EXTENSION: 'snowbridge-extension',
  promptFeatureExtensions: vi.fn(async () => [] as string[]),
}));

vi.mock('./prompt-secrets.js', () => ({
  promptSubstrateMnemonic: vi.fn(async () => '//Alice'),
  promptEvmPrivateKey: vi.fn(async () => VALID_PRIVATE_KEY),
}));

const mockedText = vi.mocked(text);
const mockedSelect = vi.mocked(select);

describe('promptGenerateOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts for every missing sdk option', async () => {
    mockedText.mockResolvedValue('prompted-app');
    mockedSelect
      .mockResolvedValueOnce('npm')
      .mockResolvedValueOnce('pjs');

    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'react',
    });

    expect(mockedText).toHaveBeenCalledOnce();
    expect(mockedSelect).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      name: 'prompted-app',
      packageManager: 'npm',
      client: 'pjs',
      evm: false,
      swap: false,
      snowbridge: false,
    });
  });

  it('does not prompt for options already provided', async () => {
    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'react',
      name: 'given-app',
      packageManager: 'npm',
      client: 'papi',
      evm: true,
    });

    expect(mockedText).not.toHaveBeenCalled();
    expect(mockedSelect).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      name: 'given-app',
      packageManager: 'npm',
      client: 'papi',
      evm: true,
    });
  });

  it('never prompts for a client on api projects', async () => {
    mockedText.mockResolvedValue('api-app');
    mockedSelect.mockResolvedValueOnce('pnpm');

    const result = await promptGenerateOptions({
      kind: 'api',
      framework: 'react',
      evm: false,
      swap: false,
      snowbridge: false,
    });

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result.client).toBeUndefined();
  });
});

describe('applyGenerateDefaults', () => {
  it('fills sdk defaults for missing options', () => {
    expect(applyGenerateDefaults({ kind: 'sdk', framework: 'react' })).toEqual({
      name: 'my-xcm-app',
      client: 'pjs',
      evm: false,
      swap: false,
      snowbridge: false,
      packageManager: 'pnpm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
  });

  it('uses the api default name and no client', () => {
    const result = applyGenerateDefaults({ kind: 'api', framework: 'react' });
    expect(result.name).toBe('my-xcm-api-app');
    expect(result.client).toBeUndefined();
  });

  it('keeps valid node secrets', () => {
    const result = applyGenerateDefaults({
      kind: 'sdk',
      framework: 'node',
      evm: true,
      substrateMnemonic: '//Alice',
      privateKey: VALID_PRIVATE_KEY,
    });
    expect(result.substrateMnemonic).toBe('//Alice');
    expect(result.privateKey).toBe(VALID_PRIVATE_KEY);
  });

  it('drops secrets for non-node frameworks', () => {
    const result = applyGenerateDefaults({
      kind: 'sdk',
      framework: 'react',
      substrateMnemonic: '//Alice',
      privateKey: VALID_PRIVATE_KEY,
    });
    expect(result.substrateMnemonic).toBeUndefined();
    expect(result.privateKey).toBeUndefined();
  });
});

describe('hasRejectedSecrets', () => {
  it('flags invalid secrets', () => {
    expect(
      hasRejectedSecrets({ kind: 'sdk', framework: 'node', privateKey: 'bad' }),
    ).toBe(true);
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        substrateMnemonic: 'definitely not a mnemonic',
      }),
    ).toBe(true);
  });

  it('accepts valid or absent secrets', () => {
    expect(hasRejectedSecrets({ kind: 'sdk', framework: 'node' })).toBe(false);
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        privateKey: VALID_PRIVATE_KEY,
        substrateMnemonic: '//Alice',
      }),
    ).toBe(false);
  });
});
