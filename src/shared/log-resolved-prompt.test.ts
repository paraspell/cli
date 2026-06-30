import figures from '@inquirer/figures';
import { styleText } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildArgvResolvedLogs,
  formatClientLabel,
  formatFeatureFlags,
  formatFrameworkLabel,
  logArgvResolvedPrompts,
  logResolvedSecret,
} from './log-resolved-prompt.js';

const SECRET_ANSWER = styleText('dim', '(provided via CLI)');

const PROMPTS = {
  name: 'Enter the project name',
  framework: 'Select the desired framework',
  packageManager: 'Select the desired package manager',
  client: 'Select the desired JS client type',
  features: 'Select the desired additional features',
  substrateMnemonic: 'Your Substrate wallet mnemonic for setup',
  privateKey: 'Your EVM wallet private key for setup',
} as const;

type BuildInput = Parameters<typeof buildArgvResolvedLogs>[0];
type ResolvedLine = { message: string; answer: string };

function sdkInput(overrides: Partial<BuildInput> = {}): BuildInput {
  return {
    argv: [],
    partial: { framework: 'react' },
    kind: 'sdk',
    defaultName: 'my-xcm-app',
    ...overrides,
  };
}

function expectResolvedLogs(
  input: BuildInput,
  expected: ResolvedLine[],
): void {
  expect(buildArgvResolvedLogs(input)).toEqual(expected);
}

function formatResolvedLine(message: string, answer: string): string {
  return `${styleText('green', figures.tick)} ${message} ${styleText('cyan', answer)}`;
}

describe('formatFrameworkLabel', () => {
  it.each([
    ['react', 'Vite - React'],
    ['vue', 'Vite - Vue'],
    ['node', 'NodeJS'],
  ] as const)('maps %s to %s', (framework, label) => {
    expect(formatFrameworkLabel(framework)).toBe(label);
  });
});

describe('formatClientLabel', () => {
  it.each([
    ['papi', 'Polkadot API'],
    ['pjs', 'Polkadot JS'],
    ['dedot', 'Dedot'],
  ] as const)('maps %s to %s', (client, label) => {
    expect(formatClientLabel(client)).toBe(label);
  });
});

describe('formatFeatureFlags', () => {
  it.each([
    [{ evm: true, swap: true, snowbridge: true }, 'EVM, Swap, Snowbridge'],
    [{ evm: true, swap: false, snowbridge: true }, 'EVM, Snowbridge'],
    [{ evm: false, swap: true, snowbridge: false }, 'Swap'],
    [{ evm: false, swap: false, snowbridge: false }, 'none'],
  ] as const)('formats %j as %s', (flags, label) => {
    expect(formatFeatureFlags(flags)).toBe(label);
  });
});

describe('buildArgvResolvedLogs', () => {
  describe('project name', () => {
    it('logs the parsed name when --name is provided', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--name', 'my-app'],
          partial: { name: 'my-app' },
        }),
        [{ message: PROMPTS.name, answer: 'my-app' }],
      );
    });

    it('logs the parsed name from --name=value', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--name=my-app'],
          partial: { name: 'my-app' },
        }),
        [{ message: PROMPTS.name, answer: 'my-app' }],
      );
    });

    it('does not log name when the flag is present without a value', () => {
      expectResolvedLogs(sdkInput({ argv: ['--name'], partial: {} }), []);
      expectResolvedLogs(
        {
          argv: ['--name'],
          partial: {},
          kind: 'api',
          defaultName: 'my-xcm-api-app',
        },
        [],
      );
    });

    it('does not log name when the flag has an invalid value', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--name', 'Invalid Name'],
          partial: { name: 'Invalid Name' },
        }),
        [],
      );
    });
  });

  describe('framework', () => {
    it('logs the formatted label only when marked as CLI-provided', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--name=my-app'],
          partial: { framework: 'react', name: 'my-app' },
          provided: { framework: true },
        }),
        [
          { message: PROMPTS.name, answer: 'my-app' },
          { message: PROMPTS.framework, answer: 'Vite - React' },
        ],
      );
    });

    it('skips the prompt when framework is not marked as CLI-provided', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--name=my-app'],
          partial: { framework: 'react', name: 'my-app' },
          provided: { framework: false },
        }),
        [{ message: PROMPTS.name, answer: 'my-app' }],
      );
    });
  });

  describe('package manager', () => {
    it('logs the parsed package manager', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--package-manager', 'npm'],
          partial: { packageManager: 'npm' },
        }),
        [{ message: PROMPTS.packageManager, answer: 'npm' }],
      );
    });

    it('does not log package manager when the flag is present without a value', () => {
      expectResolvedLogs(sdkInput({ argv: ['--package-manager'], partial: {} }), []);
    });
  });

  describe('client', () => {
    it('logs the formatted client for sdk projects', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--client', 'pjs'],
          partial: { client: 'pjs' },
        }),
        [{ message: PROMPTS.client, answer: 'Polkadot JS' }],
      );
    });

    it('does not log client when the flag is present without a value', () => {
      expectResolvedLogs(sdkInput({ argv: ['--client'], partial: {} }), []);
    });

    it('does not log the client prompt for api projects', () => {
      expectResolvedLogs(
        {
          argv: ['--client', 'papi'],
          partial: { client: 'papi' },
          kind: 'api',
          defaultName: 'my-xcm-api-app',
        },
        [],
      );
    });
  });

  describe('feature flags', () => {
    it('logs enabled flags in stable order', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--evm', '--swap', '--snowbridge'],
          partial: { evm: true, swap: true, snowbridge: true },
        }),
        [{ message: PROMPTS.features, answer: 'EVM, Swap, Snowbridge' }],
      );
    });

    it('logs none when every feature flag is explicitly disabled', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--evm=false', '--swap=false'],
          partial: { evm: false, swap: false },
        }),
        [{ message: PROMPTS.features, answer: 'none' }],
      );
    });

    it('omits the prompt when no feature flag appears in argv', () => {
      expectResolvedLogs(sdkInput({ argv: ['--name', 'my-app'], partial: { name: 'my-app' } }), [
        { message: PROMPTS.name, answer: 'my-app' },
      ]);
    });
  });

  describe('prompt order', () => {
    it('preserves sdk prompt order for mixed CLI-provided values', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--name', 'my-app', '--evm', '--client', 'pjs'],
          partial: {
            framework: 'react',
            name: 'my-app',
            client: 'pjs',
            evm: true,
          },
          provided: { framework: true },
        }),
        [
          { message: PROMPTS.name, answer: 'my-app' },
          { message: PROMPTS.framework, answer: 'Vite - React' },
          { message: PROMPTS.client, answer: 'Polkadot JS' },
          { message: PROMPTS.features, answer: 'EVM' },
        ],
      );
    });

    it('preserves sdk prompt order for framework, package manager, and features', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--package-manager', 'npm', '--evm', '--swap', '--snowbridge'],
          partial: {
            framework: 'vue',
            packageManager: 'npm',
            evm: true,
            swap: true,
            snowbridge: true,
          },
          provided: { framework: true },
        }),
        [
          { message: PROMPTS.framework, answer: 'Vite - Vue' },
          { message: PROMPTS.packageManager, answer: 'npm' },
          { message: PROMPTS.features, answer: 'EVM, Swap, Snowbridge' },
        ],
      );
    });
  });

  describe('node secrets', () => {
    it('masks substrate mnemonic and private key for node projects', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--evm', '--substrate-mnemonic', 'seed', '--private-key', '0xabc'],
          partial: {
            framework: 'node',
            evm: true,
            substrateMnemonic: 'seed',
            privateKey: '0xabc',
          },
          provided: { framework: true },
        }),
        [
          { message: PROMPTS.framework, answer: 'NodeJS' },
          { message: PROMPTS.features, answer: 'EVM' },
          { message: PROMPTS.substrateMnemonic, answer: SECRET_ANSWER },
          { message: PROMPTS.privateKey, answer: SECRET_ANSWER },
        ],
      );
    });

    it('masks the private key when snowbridge enables the EVM wallet flow', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--snowbridge', '--private-key', '0xabc'],
          partial: {
            framework: 'node',
            snowbridge: true,
            privateKey: '0xabc',
          },
          provided: { framework: true },
        }),
        [
          { message: PROMPTS.framework, answer: 'NodeJS' },
          { message: PROMPTS.features, answer: 'Snowbridge' },
          { message: PROMPTS.privateKey, answer: SECRET_ANSWER },
        ],
      );
    });

    it('does not log node secrets for non-node frameworks', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--evm', '--substrate-mnemonic', 'seed', '--private-key', '0xabc'],
          partial: { framework: 'react', evm: true },
        }),
        [{ message: PROMPTS.features, answer: 'EVM' }],
      );
    });

    it('does not log the private key when no wallet origin feature is enabled', () => {
      expectResolvedLogs(
        sdkInput({
          argv: ['--private-key', '0xabc'],
          partial: {
            framework: 'node',
            evm: false,
            snowbridge: false,
            privateKey: '0xabc',
          },
          provided: { framework: true },
        }),
        [{ message: PROMPTS.framework, answer: 'NodeJS' }],
      );
    });
  });

  describe('empty output', () => {
    it('returns no lines when nothing was provided via CLI', () => {
      expectResolvedLogs(
        {
          argv: [],
          partial: { framework: 'react' },
          kind: 'api',
          defaultName: 'my-xcm-api-app',
        },
        [],
      );
    });
  });
});

describe('logArgvResolvedPrompts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints each resolved line in order and ends with a blank line', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    logArgvResolvedPrompts(
      sdkInput({
        argv: ['--name', 'my-app', '--package-manager', 'npm'],
        partial: { name: 'my-app', packageManager: 'npm' },
      }),
    );

    expect(log.mock.calls).toEqual([
      [formatResolvedLine(PROMPTS.name, 'my-app')],
      [formatResolvedLine(PROMPTS.packageManager, 'npm')],
      [],
    ]);
  });

  it('prints nothing when there are no CLI-provided values', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    logArgvResolvedPrompts(sdkInput());

    expect(log).not.toHaveBeenCalled();
  });
});

describe('logResolvedSecret', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints the prompt with a masked CLI-provided answer', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    logResolvedSecret(PROMPTS.privateKey);

    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      formatResolvedLine(PROMPTS.privateKey, SECRET_ANSWER),
    );
  });
});
