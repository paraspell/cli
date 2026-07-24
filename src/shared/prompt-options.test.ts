import { log } from '@clack/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promptExtensions } from './extensions-checkbox.js';
import {
  applyGenerateDefaults,
  hasRejectedSecrets,
  promptGenerateOptions,
} from './prompt-options.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './prompt-secrets.js';
import {
  promptClient,
  promptConfigureWallet,
  promptName,
  promptPackageManager,
} from './prompts.js';

vi.mock('./extensions-checkbox.js');
vi.mock('./prompt-secrets.js');
vi.mock('./prompts.js');

const privateKey = `0x${'a'.repeat(64)}`;

describe('promptGenerateOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    vi.mocked(promptClient).mockResolvedValue('pjs');
    vi.mocked(promptExtensions).mockResolvedValue(['evm']);
    vi.mocked(promptName).mockResolvedValue('prompted-app');
    vi.mocked(promptPackageManager).mockResolvedValue('npm');
    vi.mocked(promptConfigureWallet).mockResolvedValue(false);
    vi.mocked(promptEvmPrivateKey).mockResolvedValue(privateKey);
    vi.mocked(promptSubstrateMnemonic).mockResolvedValue('//Alice');
  });

  it('collects missing SDK options', async () => {
    await expect(
      promptGenerateOptions({
        kind: 'sdk',
        framework: 'react',
        extensions: {},
      }),
    ).resolves.toEqual({
      name: 'prompted-app',
      client: 'pjs',
      extensions: { evm: true, swap: false, snowbridge: false },
      packageManager: 'npm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
  });

  it('collects optional node wallet secrets', async () => {
    vi.mocked(promptConfigureWallet).mockResolvedValue(true);

    const result = await promptGenerateOptions({
      kind: 'api',
      framework: 'node',
      name: 'node-api',
      packageManager: 'pnpm',
      extensions: { snowbridge: true },
    });

    expect(result).toMatchObject({
      privateKey,
      substrateMnemonic: '//Alice',
    });
  });

  it('keeps valid supplied values and ignores invalid secrets', async () => {
    const result = await promptGenerateOptions({
      kind: 'sdk',
      framework: 'node',
      name: 'given',
      client: 'dedot',
      packageManager: 'yarn',
      extensions: { evm: false },
      privateKey: 'invalid',
      substrateMnemonic: '//Alice',
    });

    expect(result).toMatchObject({
      name: 'given',
      client: 'dedot',
      packageManager: 'yarn',
      substrateMnemonic: '//Alice',
      privateKey: undefined,
    });
    expect(log.warn).toHaveBeenCalledOnce();
  });
});

describe('non-interactive options', () => {
  it('applies defaults and filters secrets by target', () => {
    expect(
      applyGenerateDefaults({
        kind: 'api',
        framework: 'react',
        extensions: { evm: true },
        privateKey,
        substrateMnemonic: '//Alice',
      }),
    ).toEqual({
      name: 'my-xcm-api-app',
      client: 'papi',
      extensions: { evm: true, swap: false, snowbridge: false },
      packageManager: 'pnpm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
  });

  it('detects rejected secrets', () => {
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        privateKey: 'invalid',
      }),
    ).toBe(true);
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        privateKey,
        substrateMnemonic: '//Alice',
      }),
    ).toBe(false);
  });
});
