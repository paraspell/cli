import {
  cancel,
  confirm,
  isCancel,
  log,
  multiselect,
  note,
  password,
  select,
  text,
} from '@clack/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ask, toClackValidate } from './clack.js';
import {
  promptClient,
  promptConfigureWallet,
  promptEvmPrivateKey,
  promptExtensions,
  promptGenerateOptions,
  promptName,
  promptPackageManager,
  promptProjectBasics,
  promptSubstrateMnemonic,
  reviewProject,
} from './prompts.js';

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>();
  return {
    ...actual,
    cancel: vi.fn(),
    confirm: vi.fn(),
    isCancel: vi.fn(() => false),
    multiselect: vi.fn(),
    note: vi.fn(),
    password: vi.fn(),
    select: vi.fn(),
    text: vi.fn(),
  };
});

describe('prompt adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isCancel).mockReturnValue(false);
  });

  it('adapts validation for Clack', () => {
    const validate = toClackValidate((value) =>
      value.length > 0 ? true : 'Required',
    );

    expect(validate(undefined)).toBe('Required');
    expect(validate('value')).toBeUndefined();
  });

  it('returns prompt values', async () => {
    vi.mocked(text).mockResolvedValue('example');
    vi.mocked(select)
      .mockResolvedValueOnce('npm')
      .mockResolvedValueOnce('dedot')
      .mockResolvedValueOnce('api')
      .mockResolvedValueOnce('vue');
    vi.mocked(confirm).mockResolvedValue(true);

    await expect(promptName('initial', () => true)).resolves.toBe('example');
    await expect(promptPackageManager('npm')).resolves.toBe('npm');
    await expect(promptClient()).resolves.toBe('dedot');
    await expect(promptConfigureWallet()).resolves.toBe(true);
    await expect(promptProjectBasics()).resolves.toEqual({
      projectType: 'api',
      framework: 'vue',
    });
  });

  it('passes selected extension defaults through', async () => {
    vi.mocked(multiselect).mockResolvedValue(['evm', 'snowbridge']);

    await expect(promptExtensions({ evm: true, swap: false })).resolves.toEqual(
      ['evm', 'snowbridge'],
    );
    expect(multiselect).toHaveBeenCalledWith(
      expect.objectContaining({ initialValues: ['evm'] }),
    );
  });

  it('trims optional secrets', async () => {
    const privateKey = `0x${'a'.repeat(64)}`;
    vi.mocked(password)
      .mockResolvedValueOnce(` ${privateKey} `)
      .mockResolvedValueOnce('   ');

    await expect(promptEvmPrivateKey()).resolves.toBe(privateKey);
    await expect(promptSubstrateMnemonic()).resolves.toBeUndefined();
  });

  it('reviews the project configuration', async () => {
    vi.mocked(confirm).mockResolvedValue(true);

    await expect(
      reviewProject({
        kind: 'sdk',
        opts: {
          framework: 'react',
          name: 'example',
          client: 'papi',
          extensions: { evm: true, swap: false, snowbridge: false },
          packageManager: 'pnpm',
          out: '/workspace/example',
        },
      }),
    ).resolves.toBe(true);

    expect(note).toHaveBeenCalledWith(
      expect.stringContaining('Client           Polkadot API'),
      'Project summary',
    );
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Continue with this configuration?',
      }),
    );
  });

  it('cancels the process when a prompt is cancelled', async () => {
    vi.mocked(isCancel).mockReturnValue(true);
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process exited');
    });

    await expect(ask(Promise.resolve(Symbol()))).rejects.toThrow(
      'process exited',
    );
    expect(cancel).toHaveBeenCalledWith('Operation cancelled.');
    expect(exit).toHaveBeenCalledWith(0);
  });
});

describe('promptGenerateOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isCancel).mockReturnValue(false);
    vi.spyOn(log, 'warn').mockImplementation(() => undefined);
  });

  it('collects missing SDK options', async () => {
    vi.mocked(select).mockResolvedValueOnce('pjs').mockResolvedValueOnce('npm');
    vi.mocked(multiselect).mockResolvedValue(['evm']);
    vi.mocked(text).mockResolvedValue('prompted-app');

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
    const privateKey = `0x${'a'.repeat(64)}`;
    vi.mocked(confirm).mockResolvedValue(true);
    vi.mocked(password)
      .mockResolvedValueOnce('//Alice')
      .mockResolvedValueOnce(privateKey);

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
