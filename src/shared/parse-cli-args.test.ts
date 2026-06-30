import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserError } from './errors.js';
import {
  assertNoStrayPositional,
  argvHasAcceptedName,
  argvHasAnyFeatureFlag,
  argvHasFlag,
  argvNameRejected,
  hasRejectedCliSecrets,
  parseApiArgv,
  parseSdkArgv,
  printApiHelp,
  printMainHelp,
  printSdkHelp,
  shiftPositionalFramework,
  shiftPositionalType,
} from './parse-cli-args.js';

const ROOT = '/tmp/paraspell-test';
const ctx = { root: ROOT, framework: 'react' as const, frameworkFlag: true };

describe('argvHasFlag', () => {
  it('detects kebab-case and camelCase aliases', () => {
    expect(argvHasFlag(['--package-manager', 'npm'], 'package-manager')).toBe(true);
    expect(argvHasFlag(['--packageManager=npm'], 'package-manager')).toBe(true);
    expect(argvHasFlag(['--client', 'pjs'], 'client')).toBe(true);
    expect(argvHasFlag(['--name=my-app'], 'name')).toBe(true);
    expect(argvHasFlag(['--package-manager'], 'package-manager')).toBe(false);
    expect(argvHasFlag(['--name'], 'name')).toBe(false);
    expect(argvHasFlag(['--name='], 'name')).toBe(false);
    expect(argvHasFlag(['--client', 'pjs'], 'package-manager')).toBe(false);
  });
});

describe('argvHasAcceptedName', () => {
  it('accepts valid CLI names and rejects invalid ones', () => {
    expect(argvHasAcceptedName(['--name', 'my-app'], 'my-app')).toBe(true);
    expect(argvHasAcceptedName(['--name=my-app'], 'my-app')).toBe(true);
    expect(argvHasAcceptedName(['--name', 'Invalid Name'], 'Invalid Name')).toBe(
      false,
    );
    expect(argvHasAcceptedName(['--name'], 'my-xcm-app')).toBe(false);
    expect(argvHasAcceptedName([], 'my-app')).toBe(false);
  });

  it('detects rejected names', () => {
    expect(argvNameRejected(['--name', 'Invalid Name'], 'Invalid Name')).toBe(true);
    expect(argvNameRejected(['--name', 'my-app'], 'my-app')).toBe(false);
    expect(argvNameRejected([], 'my-app')).toBe(false);
  });
});

describe('argvHasAnyFeatureFlag', () => {
  it('detects any feature flag', () => {
    expect(argvHasAnyFeatureFlag(['--evm'])).toBe(true);
    expect(argvHasAnyFeatureFlag(['--swap=false'])).toBe(true);
    expect(argvHasAnyFeatureFlag(['--name', 'x'])).toBe(false);
  });
});

describe('shiftPositionalType', () => {
  it.each([
    [['sdk', 'react', '--name', 'x'], { argv: ['react', '--name', 'x'], type: 'sdk' }],
    [['api', 'node', '--evm'], { argv: ['node', '--evm'], type: 'api' }],
    [['--type', 'sdk'], { argv: ['--type', 'sdk'], type: null }],
    [[], { argv: [], type: null }],
  ] as const)('shifts %j', (argv, expected) => {
    expect(shiftPositionalType([...argv])).toEqual(expected);
  });
});

describe('shiftPositionalFramework', () => {
  it.each([
    [['react', '--name', 'x'], { argv: ['--name', 'x'], framework: 'react' }],
    [['vue', '--evm'], { argv: ['--evm'], framework: 'vue' }],
    [['node'], { argv: [], framework: 'node' }],
    [['--name', 'x'], { argv: ['--name', 'x'], framework: null }],
    [['not-a-framework', '--name', 'x'], { argv: ['not-a-framework', '--name', 'x'], framework: null }],
  ] as const)('shifts %j', (argv, expected) => {
    expect(shiftPositionalFramework([...argv])).toEqual(expected);
  });
});

describe('assertNoStrayPositional', () => {
  it('allows argv when a framework positional was already consumed', () => {
    expect(() => assertNoStrayPositional(['--name', 'x'], 'react')).not.toThrow();
  });

  it('throws for an unknown leading positional', () => {
    expect(() => assertNoStrayPositional(['bogus'], null)).toThrow(UserError);
    expect(() => assertNoStrayPositional(['bogus'], null)).toThrow(
      /Unknown argument "bogus"/,
    );
  });
});

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('parseSdkArgv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies defaults for an empty argv', () => {
    expect(parseSdkArgv([], ctx)).toMatchObject({
      framework: 'react',
      name: 'my-xcm-app',
      client: 'pjs',
      evm: false,
      swap: false,
      snowbridge: false,
      packageManager: 'pnpm',
      out: path.join(ROOT, 'generated', 'xcm-sdk', 'react', 'my-xcm-app'),
    });
  });

  it('parses name, client, framework, package manager, and out', () => {
    expect(
      parseSdkArgv(
        [
          '--name',
          'my-app',
          '--client',
          'papi',
          '--framework',
          'vue',
          '--package-manager',
          'npm',
          '--out',
          'dist/my-app',
        ],
        ctx,
      ),
    ).toMatchObject({
      name: 'my-app',
      client: 'papi',
      framework: 'vue',
      packageManager: 'npm',
      out: path.join(ROOT, 'dist/my-app'),
    });
  });

  it('accepts client aliases and camelCase flags', () => {
    expect(parseSdkArgv(['--client', 'polkadot-api'], ctx).client).toBe('papi');
    expect(parseSdkArgv(['--packageManager=yarn'], ctx).packageManager).toBe('yarn');
    expect(parseSdkArgv(['--name=my-app'], ctx).name).toBe('my-app');
  });

  it('parses node secrets', () => {
    expect(
      parseSdkArgv(
        ['--substrate-mnemonic', '//Alice', '--private-key', VALID_PRIVATE_KEY],
        { ...ctx, framework: 'node' },
      ),
    ).toMatchObject({
      substrateMnemonic: '//Alice',
      privateKey: VALID_PRIVATE_KEY,
    });
  });

  it('ignores invalid node secrets and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      parseSdkArgv(['--private-key', '0xabc'], { ...ctx, framework: 'node' }),
    ).not.toHaveProperty('privateKey');
    expect(
      parseSdkArgv(['--substrate-mnemonic', 'seed'], { ...ctx, framework: 'node' }),
    ).not.toHaveProperty('substrateMnemonic');
    expect(warn).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('detects rejected CLI secrets', () => {
    const argv = [
      '--substrate-mnemonic',
      'seed',
      '--private-key',
      '0xabc',
    ];
    const opts = parseSdkArgv(argv, { ...ctx, framework: 'node' });
    expect(hasRejectedCliSecrets(argv, opts)).toBe(true);
    expect(
      hasRejectedCliSecrets(
        ['--substrate-mnemonic', '//Alice', '--private-key', VALID_PRIVATE_KEY],
        {
          substrateMnemonic: '//Alice',
          privateKey: VALID_PRIVATE_KEY,
        },
      ),
    ).toBe(false);
  });

  it('sets help when --help is present', () => {
    expect(parseSdkArgv(['--help'], ctx).help).toBe(true);
  });

  it('enables a feature when the bare flag is present', () => {
    expect(parseSdkArgv(['--evm'], ctx).evm).toBe(true);
    expect(parseSdkArgv(['--swap'], ctx).swap).toBe(true);
    expect(parseSdkArgv(['--snowbridge'], ctx).snowbridge).toBe(true);
  });

  it('still accepts explicit true|false values', () => {
    expect(parseSdkArgv(['--evm', 'true'], ctx).evm).toBe(true);
    expect(parseSdkArgv(['--evm', 'false'], ctx).evm).toBe(false);
    expect(parseSdkArgv(['--evm=false'], ctx).evm).toBe(false);
  });

  it('defaults features to false when omitted', () => {
    expect(parseSdkArgv([], ctx)).toMatchObject({
      evm: false,
      swap: false,
      snowbridge: false,
    });
  });

  it('rejects unknown framework, client, and package manager values', () => {
    expect(() => parseSdkArgv(['--framework', 'angular'], ctx)).toThrow(/Unknown --framework/);
    expect(() => parseSdkArgv(['--client', 'substrate'], ctx)).toThrow(/Unknown --client/);
    expect(() => parseSdkArgv(['--package-manager', 'deno'], ctx)).toThrow(
      /Unknown --package-manager/,
    );
  });

  it('ignores value flags without values and keeps defaults', () => {
    expect(parseSdkArgv(['--name'], ctx)).toMatchObject({
      name: 'my-xcm-app',
      packageManager: 'pnpm',
    });
    expect(parseSdkArgv(['--client', '--evm'], ctx)).toMatchObject({
      client: 'pjs',
      evm: true,
    });
    expect(parseSdkArgv(['--name=', '--package-manager='], ctx)).toMatchObject({
      name: 'my-xcm-app',
      packageManager: 'pnpm',
    });
  });

  it('warns on unknown options instead of failing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    parseSdkArgv(['--bogus'], ctx);
    expect(warn).toHaveBeenCalledWith('Warning: unknown option --bogus ignored.');
  });
});

describe('parseApiArgv', () => {
  it('applies api defaults and ignores client flags as unknown', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseApiArgv([], ctx)).toMatchObject({
      framework: 'react',
      name: 'my-xcm-api-app',
      out: path.join(ROOT, 'generated', 'xcm-api', 'react', 'my-xcm-api-app'),
    });
    parseApiArgv(['--client', 'pjs'], ctx);
    expect(warn).toHaveBeenCalledWith('Warning: unknown option --client ignored.');
    vi.restoreAllMocks();
  });

  it('parses shared flags', () => {
    expect(
      parseApiArgv(
        ['--name', 'api-app', '--framework', 'node', '--evm', '--package-manager', 'bun'],
        ctx,
      ),
    ).toMatchObject({
      name: 'api-app',
      framework: 'node',
      evm: true,
      packageManager: 'bun',
    });
  });
});

describe('help printers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints main help', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    printMainHelp();
    expect(log.mock.calls[0]?.[0]).toContain('create-paraspell sdk');
    expect(log.mock.calls[0]?.[0]).toContain('--type sdk|api');
  });

  it('prints sdk help with a custom command label', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    printSdkHelp('create-paraspell sdk');
    expect(log.mock.calls[0]?.[0]).toContain('create-paraspell sdk');
    expect(log.mock.calls[0]?.[0]).toContain('--client');
    expect(log.mock.calls[0]?.[0]).toContain('--substrate-mnemonic');
    expect(log.mock.calls[0]?.[0]).toContain('--private-key');
  });

  it('prints api help with a custom command label', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    printApiHelp('create-paraspell api');
    expect(log.mock.calls[0]?.[0]).toContain('create-paraspell api');
    expect(log.mock.calls[0]?.[0]).not.toContain('--client');
    expect(log.mock.calls[0]?.[0]).toContain('--substrate-mnemonic');
    expect(log.mock.calls[0]?.[0]).toContain('--private-key');
  });
});
