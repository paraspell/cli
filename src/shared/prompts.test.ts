import {
  cancel,
  confirm,
  isCancel,
  multiselect,
  password,
  select,
  text,
} from '@clack/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ask, toClackValidate } from './clack.js';
import { promptExtensions } from './extensions-checkbox.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './prompt-secrets.js';
import {
  promptClient,
  promptConfigureWallet,
  promptName,
  promptPackageManager,
  promptProjectBasics,
} from './prompts.js';

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>();
  return {
    ...actual,
    cancel: vi.fn(),
    confirm: vi.fn(),
    isCancel: vi.fn(() => false),
    multiselect: vi.fn(),
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
