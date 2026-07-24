import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirm, select, text } from '@clack/prompts';
import {
  applyGenerateDefaults,
  hasRejectedSecrets,
  promptGenerateOptions,
} from './prompt-options.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './prompt-secrets.js';

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>();
  return {
    ...actual,
    text: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    log: { ...actual.log, warn: vi.fn() },
    cancel: vi.fn(),
    isCancel: vi.fn(() => false),
  };
});

vi.mock('./extensions-checkbox.js', () => ({
  promptExtensions: vi.fn(() => Promise.resolve<string[]>([])),
}));

vi.mock('./prompt-secrets.js', () => ({
  promptSubstrateMnemonic: vi.fn(() => Promise.resolve('//Alice')),
  promptEvmPrivateKey: vi.fn(() => Promise.resolve(VALID_PRIVATE_KEY)),
}));

const mockedText = vi.mocked(text);
const mockedSelect = vi.mocked(select);
const mockedConfirm = vi.mocked(confirm);
const mockedSubstratePrompt = vi.mocked(promptSubstrateMnemonic);
const mockedEvmPrompt = vi.mocked(promptEvmPrivateKey);

describe('promptGenerateOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedConfirm.mockResolvedValue(false);
  });

  it('prompts for every missing sdk option', async () => {
    mockedText.mockResolvedValue('prompted-app');
    mockedSelect.mockResolvedValueOnce('pjs').mockResolvedValueOnce('npm');

    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'react',
      extensions: {},
    });

    expect(mockedText).toHaveBeenCalledOnce();
    expect(mockedSelect).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      name: 'prompted-app',
      packageManager: 'npm',
      client: 'pjs',
      extensions: { evm: false, swap: false, snowbridge: false },
    });
  });

  it('does not prompt for options already provided', async () => {
    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'react',
      name: 'given-app',
      packageManager: 'npm',
      client: 'papi',
      extensions: { evm: true },
    });

    expect(mockedText).not.toHaveBeenCalled();
    expect(mockedSelect).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      name: 'given-app',
      packageManager: 'npm',
      client: 'papi',
      extensions: { evm: true },
    });
  });

  it('uses the default client without prompting on api projects', async () => {
    mockedText.mockResolvedValue('api-app');
    mockedSelect.mockResolvedValueOnce('pnpm');

    const result = await promptGenerateOptions({
      kind: 'api',
      framework: 'react',
      extensions: { evm: false, swap: false, snowbridge: false },
    });

    expect(mockedSelect).toHaveBeenCalledOnce();
    expect(result.client).toBe('papi');
  });

  it('asks before collecting optional node wallet secrets', async () => {
    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'node',
      name: 'node-app',
      packageManager: 'pnpm',
      client: 'pjs',
      extensions: { evm: true },
    });

    expect(mockedConfirm).toHaveBeenCalledOnce();
    expect(mockedSubstratePrompt).not.toHaveBeenCalled();
    expect(mockedEvmPrompt).not.toHaveBeenCalled();
    expect(result.substrateMnemonic).toBeUndefined();
    expect(result.privateKey).toBeUndefined();
  });

  it('collects node wallet secrets after the user opts in', async () => {
    mockedConfirm.mockResolvedValue(true);

    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'node',
      name: 'node-app',
      packageManager: 'pnpm',
      client: 'pjs',
      extensions: { evm: true },
    });

    expect(mockedSubstratePrompt).toHaveBeenCalledOnce();
    expect(mockedEvmPrompt).toHaveBeenCalledOnce();
    expect(result.substrateMnemonic).toBe('//Alice');
    expect(result.privateKey).toBe(VALID_PRIVATE_KEY);
  });
});

describe('applyGenerateDefaults', () => {
  it('fills sdk defaults for missing options', () => {
    expect(
      applyGenerateDefaults({
        kind: 'sdk',
        framework: 'react',
        extensions: {},
      }),
    ).toEqual({
      name: 'my-xcm-app',
      client: 'papi',
      extensions: { evm: false, swap: false, snowbridge: false },
      packageManager: 'pnpm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
  });

  it('uses the api defaults', () => {
    const result = applyGenerateDefaults({
      kind: 'api',
      framework: 'react',
      extensions: {},
    });
    expect(result.name).toBe('my-xcm-api-app');
    expect(result.client).toBe('papi');
  });

  it('keeps valid node secrets', () => {
    const result = applyGenerateDefaults({
      kind: 'sdk',
      framework: 'node',
      extensions: { evm: true },
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
      extensions: {},
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
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        privateKey: 'bad',
      }),
    ).toBe(true);
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        substrateMnemonic: 'definitely not a mnemonic',
      }),
    ).toBe(true);
  });

  it('accepts valid or absent secrets', () => {
    expect(
      hasRejectedSecrets({ kind: 'sdk', framework: 'node', extensions: {} }),
    ).toBe(false);
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        privateKey: VALID_PRIVATE_KEY,
        substrateMnemonic: '//Alice',
      }),
    ).toBe(false);
  });
});
