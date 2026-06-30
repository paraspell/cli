import path from 'node:path';
import { applyFeatureFlags } from './feature-flags.js';
import { UserError } from './errors.js';
import { parseBool } from './parse-bool.js';
import {
  normalizePackageManager,
  PACKAGE_MANAGERS,
  type PackageManager,
} from './package-manager.js';
import { parseFramework } from './frameworks.js';
import {
  parseSecretFlag,
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';
import type {
  ApiGenerateOptions,
  Framework,
  ProjectType,
  SdkClient,
  SdkGenerateOptions,
} from './types.js';

type ArgRecord = Record<string, string | boolean>;

export function getArgvFlag(
  argv: string[],
  key: string,
): string | boolean | undefined {
  return parseArgv(argv)[key];
}

const FLAG_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'package-manager': ['package-manager', 'packageManager'],
  'private-key': ['private-key', 'privateKey'],
  'substrate-mnemonic': ['substrate-mnemonic', 'substrateMnemonic'],
};

const VALUE_FLAGS = new Set([
  'name',
  'framework',
  'client',
  'package-manager',
  'packageManager',
  'out',
  'private-key',
  'privateKey',
  'substrate-mnemonic',
  'substrateMnemonic',
]);

function isValueFlag(flag: string): boolean {
  return VALUE_FLAGS.has(flag) || flag in FLAG_ALIASES;
}

function argvEntryHasValue(argv: string[], index: number): boolean {
  const arg = argv[index]!;
  const [, inlineValue] = arg.slice(2).split('=', 2);
  if (inlineValue !== undefined) return inlineValue !== '';
  const next = argv[index + 1];
  return next !== undefined && !next.startsWith('--');
}

export function argvHasFlag(argv: string[], flag: string): boolean {
  const names = new Set(FLAG_ALIASES[flag] ?? [flag]);
  const needsValue = isValueFlag(flag);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const flagKey = arg.slice(2).split('=')[0]!;
    if (!names.has(flagKey)) continue;
    if (needsValue) return argvEntryHasValue(argv, i);
    return true;
  }
  return false;
}

export function argvHasAnyFeatureFlag(argv: string[]): boolean {
  return (
    argvHasFlag(argv, 'evm') ||
    argvHasFlag(argv, 'swap') ||
    argvHasFlag(argv, 'snowbridge')
  );
}

export function argvHasAcceptedName(
  argv: string[],
  name: string | undefined,
): boolean {
  if (!argvHasFlag(argv, 'name')) return false;
  const resolved =
    name ??
    (() => {
      const value = getArgvFlag(argv, 'name');
      return typeof value === 'string' ? value : undefined;
    })();
  return validateNameInput(resolved ?? '') === true;
}

export function argvNameRejected(
  argv: string[],
  name: string | undefined,
): boolean {
  return argvHasFlag(argv, 'name') && !argvHasAcceptedName(argv, name);
}

export function argvSecretRejected(
  argv: string[],
  flag: 'private-key' | 'substrate-mnemonic',
  value: string | undefined,
): boolean {
  return argvHasFlag(argv, flag) && value === undefined;
}

export function hasRejectedCliSecrets(
  argv: string[],
  opts: Pick<ApiGenerateOptions, 'privateKey' | 'substrateMnemonic'>,
): boolean {
  return (
    argvSecretRejected(argv, 'private-key', opts.privateKey) ||
    argvSecretRejected(argv, 'substrate-mnemonic', opts.substrateMnemonic)
  );
}

function parseArgv(argv: string[]): ArgRecord {
  const opts: ArgRecord = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const raw = arg.slice(2);
    const [key, inlineValue] = raw.split('=', 2);
    if (inlineValue !== undefined) {
      opts[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      opts[key] = next;
      i++;
      continue;
    }
    opts[key] = true;
  }
  return opts;
}

function resolveOut(root: string, out: string): string {
  return path.isAbsolute(out) ? out : path.join(root, out);
}

const CLIENT_ALIASES: Record<string, SdkClient> = {
  papi: 'papi',
  pjs: 'pjs',
  dedot: 'dedot',
  'polkadot-api': 'papi',
  'polkadot-js': 'pjs',
};

const FRAMEWORKS_ALLOWED = ['react', 'vue', 'node'];
const CLIENTS_ALLOWED = ['papi', 'pjs', 'dedot'];

function parseClient(value: string): SdkClient | null {
  return CLIENT_ALIASES[value.toLowerCase()] ?? null;
}

function valueFlag(flags: ArgRecord, key: string): string | undefined {
  const value = flags[key];
  if (value === undefined || value === true) return undefined;
  if (typeof value !== 'string') {
    throw new UserError(`Option --${key} requires a value.`);
  }
  if (value === '') return undefined;
  return value;
}

function requireKnown<T>(
  raw: string,
  parsed: T | null,
  flag: string,
  allowed: readonly string[],
): T {
  if (parsed === null) {
    throw new UserError(
      `Unknown ${flag} "${raw}". Expected one of: ${allowed.join(', ')}.`,
    );
  }
  return parsed;
}

function parsePackageManagerFlag(
  flags: ArgRecord,
): PackageManager | undefined {
  const raw = valueFlag(flags, 'package-manager') ?? valueFlag(flags, 'packageManager');
  if (raw === undefined) return undefined;
  if (!(PACKAGE_MANAGERS as readonly string[]).includes(raw.toLowerCase())) {
    throw new UserError(
      `Unknown --package-manager "${raw}". Expected one of: ${PACKAGE_MANAGERS.join(', ')}.`,
    );
  }
  return normalizePackageManager(raw);
}

const KNOWN_FLAGS_COMMON = [
  'help', 'type', 'framework', 'name',
  'evm', 'swap', 'snowbridge',
  'package-manager', 'packageManager', 'out',
  'private-key', 'privateKey',
  'substrate-mnemonic', 'substrateMnemonic',
];

function warnUnknownFlags(flags: ArgRecord, extra: readonly string[]): void {
  const known = new Set<string>([...KNOWN_FLAGS_COMMON, ...extra]);
  for (const key of Object.keys(flags)) {
    if (!known.has(key)) {
      console.warn(`Warning: unknown option --${key} ignored.`);
    }
  }
}

export function assertNoStrayPositional(
  argv: string[],
  framework: Framework | null,
): void {
  if (!framework && argv[0] !== undefined && !argv[0].startsWith('--')) {
    throw new UserError(
      `Unknown argument "${argv[0]}". Expected a framework ` +
        `(${FRAMEWORKS_ALLOWED.join(', ')}) or options like --name.`,
    );
  }
}

type ParseCtx = { root: string; framework: Framework; frameworkFlag?: boolean };

function applyCommonFlags(
  opts: ApiGenerateOptions,
  flags: ArgRecord,
  ctx: ParseCtx,
): void {
  if (flags.help === true) opts.help = true;

  if (ctx.frameworkFlag) {
    const framework = valueFlag(flags, 'framework');
    if (framework !== undefined) {
      opts.framework = requireKnown(
        framework, parseFramework(framework), '--framework', FRAMEWORKS_ALLOWED,
      );
    }
  }

  const name = valueFlag(flags, 'name');
  if (name !== undefined) opts.name = name;

  opts.evm = parseBool(flags.evm, opts.evm);
  opts.swap = parseBool(flags.swap, opts.swap);
  opts.snowbridge = parseBool(flags.snowbridge, opts.snowbridge);

  const packageManager = parsePackageManagerFlag(flags);
  if (packageManager !== undefined) opts.packageManager = packageManager;

  const out = valueFlag(flags, 'out');
  if (out !== undefined) opts.out = resolveOut(ctx.root, out);

  const privateKey = valueFlag(flags, 'private-key') ?? valueFlag(flags, 'privateKey');
  if (privateKey !== undefined) {
    const parsed = parseSecretFlag('--private-key', privateKey, validateEvmPrivateKey);
    if (parsed !== undefined) opts.privateKey = parsed;
  }

  const substrateMnemonic =
    valueFlag(flags, 'substrate-mnemonic') ?? valueFlag(flags, 'substrateMnemonic');
  if (substrateMnemonic !== undefined) {
    const parsed = parseSecretFlag(
      '--substrate-mnemonic',
      substrateMnemonic,
      validateSubstrateMnemonic,
    );
    if (parsed !== undefined) opts.substrateMnemonic = parsed;
  }
}

export function parseSdkArgv(argv: string[], ctx: ParseCtx): SdkGenerateOptions {
  const flags = parseArgv(argv);
  warnUnknownFlags(flags, ['client']);
  const opts: SdkGenerateOptions = {
    framework: ctx.framework,
    name: 'my-xcm-app',
    client: 'pjs',
    evm: false,
    swap: false,
    snowbridge: false,
    packageManager: 'pnpm',
    out: path.join(ctx.root, 'generated', 'xcm-sdk', ctx.framework, 'my-xcm-app'),
  };

  applyCommonFlags(opts, flags, ctx);

  const client = valueFlag(flags, 'client');
  if (client !== undefined) {
    opts.client = requireKnown(client, parseClient(client), '--client', CLIENTS_ALLOWED);
  }

  return applyFeatureFlags(opts);
}

export function parseApiArgv(argv: string[], ctx: ParseCtx): ApiGenerateOptions {
  const flags = parseArgv(argv);
  warnUnknownFlags(flags, []);
  const opts: ApiGenerateOptions = {
    framework: ctx.framework,
    name: 'my-xcm-api-app',
    evm: false,
    swap: false,
    snowbridge: false,
    packageManager: 'pnpm',
    out: path.join(ctx.root, 'generated', 'xcm-api', ctx.framework, 'my-xcm-api-app'),
  };

  applyCommonFlags(opts, flags, ctx);

  return applyFeatureFlags(opts);
}

export function shiftPositionalType(argv: string[]): {
  argv: string[];
  type: ProjectType | null;
} {
  const rest = [...argv];
  if (rest[0] === 'sdk' || rest[0] === 'api') {
    const type = rest[0];
    rest.shift();
    return { argv: rest, type };
  }
  return { argv: rest, type: null };
}

export function shiftPositionalFramework(argv: string[]): {
  argv: string[];
  framework: Framework | null;
} {
  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith('--')) {
    const parsed = parseFramework(rest[0]);
    if (parsed) {
      rest.shift();
      return { argv: rest, framework: parsed };
    }
  }
  return { argv: rest, framework: null };
}

const SECRET_OPTIONS = `  --substrate-mnemonic <secret>  optional Substrate mnemonic or //Dev URI for node (non-interactive)
  --private-key <hex>     optional wallet key for node when using EVM or Snowbridge origins`;

const SHARED_OPTIONS = `  --framework <id>        react | vue | node
  --name <string>
  --evm, --swap, --snowbridge  include flag to enable (omit for false; explicit true|false also accepted)
${SECRET_OPTIONS}
  --package-manager <id>  npm | yarn | pnpm | bun
  --out <path>            default: ./<name> in cwd
  --help`;

export function printMainHelp(): void {
  console.log(`Usage: create-paraspell
       create-paraspell sdk [framework] [options]
       create-paraspell api [framework] [options]

Run without arguments for interactive mode.

Non-interactive:
  --type sdk|api          same as sdk|api subcommand

SDK-only:
  --client <id>           papi | pjs | dedot

${SHARED_OPTIONS}
`);
}

export function printSdkHelp(command = 'npm run generate:sdk'): void {
  console.log(`Usage: ${command} -- [framework] [options]

Options:
  --framework <id>        react | vue | node
  --name <string>
  --client <id>           papi | pjs | dedot
  --evm, --swap, --snowbridge  include flag to enable (omit for false; explicit true|false also accepted)
${SECRET_OPTIONS}
  --package-manager <id>  npm | yarn | pnpm | bun
  --out <path>
  --help
`);
}

export function printApiHelp(command = 'npm run generate:xcm-api'): void {
  console.log(`Usage: ${command} -- [framework] [options]

Options:
  --framework <id>        react | vue | node
  --name <string>
  --evm, --swap, --snowbridge  include flag to enable (omit for false; explicit true|false also accepted)
${SECRET_OPTIONS}
  --package-manager <id>  npm | yarn | pnpm | bun
  --out <path>
  --help
`);
}
