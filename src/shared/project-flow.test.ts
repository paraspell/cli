import { cancel, confirm, log, spinner } from '@clack/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateApp } from '../generator/generate.js';
import { installDependencies } from './install-dependencies.js';
import { printNextSteps } from './next-steps.js';
import { runProjectFlow } from './project-flow.js';
import { promptGenerateOptions } from './prompt-options.js';

vi.mock('@clack/prompts');

vi.mock('../generator/generate.js');
vi.mock('./install-dependencies.js');
vi.mock('./next-steps.js');

vi.mock('./prompt-options.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./prompt-options.js')>();
  return {
    ...actual,
    promptGenerateOptions: vi.fn(),
  };
});

const resolvedOptions: Awaited<ReturnType<typeof promptGenerateOptions>> = {
  name: 'example',
  client: 'papi',
  packageManager: 'pnpm',
  extensions: { evm: true, swap: false, snowbridge: false },
  privateKey: undefined,
  substrateMnemonic: undefined,
};

const flowOptions: Parameters<typeof runProjectFlow>[0] = {
  input: {
    kind: 'sdk',
    framework: 'react',
    name: 'example',
    client: 'papi',
    packageManager: 'pnpm',
    extensions: { evm: true },
  },
  resolveOut: () => '/tmp/example',
  interactive: false,
  userFacing: false,
};

describe('runProjectFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spinner).mockReturnValue({
      start: vi.fn(),
      stop: vi.fn(),
      cancel: vi.fn(),
      error: vi.fn(),
      message: vi.fn(),
      clear: vi.fn(),
      isCancelled: false,
    });
    vi.mocked(confirm).mockResolvedValue(true);
    vi.mocked(generateApp).mockResolvedValue();
    vi.mocked(installDependencies).mockResolvedValue({ ok: true, output: '' });
    vi.mocked(promptGenerateOptions).mockResolvedValue(resolvedOptions);
  });

  it('generates resolved non-interactive options', async () => {
    const validateOutput = vi.fn();

    await runProjectFlow({ ...flowOptions, validateOutput });

    expect(validateOutput).toHaveBeenCalledWith('example', '/tmp/example');
    expect(generateApp).toHaveBeenCalledWith({
      kind: 'sdk',
      opts: {
        framework: 'react',
        ...resolvedOptions,
        out: '/tmp/example',
      },
    });
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it('rejects invalid non-interactive secrets', async () => {
    await expect(
      runProjectFlow({
        ...flowOptions,
        input: {
          ...flowOptions.input,
          framework: 'node',
          privateKey: 'invalid',
        },
      }),
    ).rejects.toThrow('Invalid --private-key');
    expect(generateApp).not.toHaveBeenCalled();
  });

  it('stops when an interactive review is declined', async () => {
    vi.mocked(confirm).mockResolvedValue(false);

    await runProjectFlow({
      ...flowOptions,
      interactive: true,
      userFacing: true,
    });

    expect(cancel).toHaveBeenCalledWith('No files were created.');
    expect(generateApp).not.toHaveBeenCalled();
  });

  it('installs dependencies after confirmed interactive generation', async () => {
    await runProjectFlow({
      ...flowOptions,
      interactive: true,
      userFacing: true,
    });

    expect(installDependencies).toHaveBeenCalledWith('/tmp/example', 'pnpm');
    expect(printNextSteps).toHaveBeenCalledWith(
      expect.objectContaining({ installation: 'installed' }),
    );
  });

  it('reports installation failures but keeps the generated project', async () => {
    vi.mocked(installDependencies).mockResolvedValue({
      ok: false,
      output: 'first line\nnetwork unavailable',
    });

    await runProjectFlow({
      ...flowOptions,
      interactive: true,
      userFacing: true,
    });

    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining('network unavailable'),
    );
    expect(printNextSteps).toHaveBeenCalledWith(
      expect.objectContaining({ installation: 'failed' }),
    );
  });

  it('propagates generation failures', async () => {
    vi.mocked(generateApp).mockRejectedValue(new Error('write failed'));

    await expect(
      runProjectFlow({ ...flowOptions, userFacing: true }),
    ).rejects.toThrow('write failed');
    expect(printNextSteps).not.toHaveBeenCalled();
  });
});
