import fs from 'node:fs';
import path from 'node:path';
import { intro } from '@clack/prompts';
import {
  type Application,
  buildApplication,
  buildCommand,
  buildRouteMap,
  type CommandContext,
  type FlagParametersForType,
  help,
  run,
} from '@stricli/core';
import { runInteractiveGenerate } from './interactive.js';
import {
  frameworkPositional,
  packageManagerFlag,
} from './shared/cli-params.js';
import { CLI_INTRO } from './shared/messages.js';
import {
  DEFAULT_FRAMEWORK,
  FRAMEWORKS,
  PROJECT_TYPE_OPTIONS,
  SDK_CLIENTS,
  type TExtensions,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from './shared/project-options.js';
import { runProjectFlow } from './shared/project-flow.js';
import type { TNameValidator } from './shared/prompt-options.js';
import type { TResolveInput } from './shared/types.js';
import { validateNameInput } from './shared/validate.js';

interface TAppContext extends CommandContext {
  root: string;
  consumer: boolean;
}

export type TRunContext = {
  root: string;
  consumer?: boolean;
};

type TSharedFlags = {
  name?: string;
  framework?: TFramework;
  extensions: Partial<TExtensions>;
  packageManager?: TPackageManager;
  out?: string;
  privateKey?: string;
  substrateMnemonic?: string;
};

type TCliSharedFlags = Omit<TSharedFlags, 'extensions'> & Partial<TExtensions>;
type TSdkFlags = TCliSharedFlags & { client?: TSdkClient };
type TApiFlags = TCliSharedFlags;

const identity = (value: string): string => value;

const parseNameArg = (value: string): string => {
  const result = validateNameInput(value);
  if (result !== true) throw new Error(result);
  return value;
};

const sharedFlagParams: FlagParametersForType<TCliSharedFlags> = {
  name: {
    kind: 'parsed',
    parse: parseNameArg,
    brief: 'Project name',
    optional: true,
  },
  framework: {
    kind: 'enum',
    values: FRAMEWORKS,
    brief: 'Target framework: react | vue | node',
    optional: true,
  },
  evm: { kind: 'boolean', brief: 'Enable EVM origin chains', optional: true },
  swap: {
    kind: 'boolean',
    brief: 'Enable cross-chain swaps (@paraspell/swap)',
    optional: true,
  },
  snowbridge: {
    kind: 'boolean',
    brief: 'Enable Snowbridge transfers',
    optional: true,
  },
  packageManager: packageManagerFlag,
  out: {
    kind: 'parsed',
    parse: identity,
    brief: 'Output directory',
    optional: true,
  },
  privateKey: {
    kind: 'parsed',
    parse: identity,
    brief: 'EVM wallet key for node when using EVM or Snowbridge origins',
    optional: true,
  },
  substrateMnemonic: {
    kind: 'parsed',
    parse: identity,
    brief: 'Substrate mnemonic or //Dev URI for node',
    optional: true,
  },
};

const sdkFlagParams: FlagParametersForType<TSdkFlags> = {
  ...sharedFlagParams,
  client: {
    kind: 'enum',
    values: SDK_CLIENTS,
    brief: 'JS client: papi | pjs | dedot',
    optional: true,
  },
};

const resolveOut = (root: string, out: string): string =>
  path.isAbsolute(out) ? out : path.join(root, out);

const defaultInternalOut = (
  root: string,
  kind: TProjectType,
  framework: TFramework,
  name: string,
): string =>
  path.join(
    root,
    'generated',
    PROJECT_TYPE_OPTIONS[kind].generatedDir,
    framework,
    name,
  );

const assertConsumerProject = (name: string, outDir: string): void => {
  const nameError = validateNameInput(name);
  if (nameError !== true) throw new Error(nameError);
  if (fs.existsSync(outDir)) {
    throw new Error(`Project already exists: ${outDir}`);
  }
};

const makeConsumerNameValidator = (
  root: string,
  outFlag: string | undefined,
): TNameValidator => {
  return (name) => {
    const base = validateNameInput(name);
    if (base !== true) return base;
    const out =
      outFlag !== undefined ? resolveOut(root, outFlag) : path.join(root, name);
    if (fs.existsSync(out)) return `Project already exists: ${out}`;
    return true;
  };
};

const runGenerate = async (
  kind: TProjectType,
  ctx: TAppContext,
  flags: TSdkFlags,
  positionalFramework?: TFramework,
): Promise<Error | void> => {
  try {
    const framework =
      flags.framework ?? positionalFramework ?? DEFAULT_FRAMEWORK;
    const input: TResolveInput = {
      kind,
      framework,
      name: flags.name,
      client: kind === 'sdk' ? flags.client : undefined,
      extensions: {
        evm: flags.evm,
        swap: flags.swap,
        snowbridge: flags.snowbridge,
      },
      packageManager: flags.packageManager,
      privateKey: flags.privateKey,
      substrateMnemonic: flags.substrateMnemonic,
    };
    const interactive = process.stdin.isTTY === true;

    const validateName = ctx.consumer
      ? makeConsumerNameValidator(ctx.root, flags.out)
      : undefined;

    if (ctx.consumer && interactive) intro(CLI_INTRO);
    await runProjectFlow({
      input,
      resolveOut: (resolved) => {
        if (flags.out !== undefined) {
          return resolveOut(ctx.root, flags.out);
        }
        if (ctx.consumer) {
          return path.join(ctx.root, resolved.name);
        }
        return defaultInternalOut(ctx.root, kind, framework, resolved.name);
      },
      validateName,
      validateOutput: ctx.consumer ? assertConsumerProject : undefined,
      interactive,
      userFacing: ctx.consumer,
    });
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};

const createApp = (): Application<TAppContext> => {
  const sdk = buildCommand<TSdkFlags, [TFramework?], TAppContext>({
    docs: { brief: 'Scaffold a ParaSpell XCM SDK starter app' },
    parameters: { positional: frameworkPositional, flags: sdkFlagParams },
    func(flags, framework) {
      return runGenerate('sdk', this, flags, framework);
    },
  });

  const api = buildCommand<TApiFlags, [TFramework?], TAppContext>({
    docs: { brief: 'Scaffold a ParaSpell XCM API starter app' },
    parameters: { positional: frameworkPositional, flags: sharedFlagParams },
    func(flags, framework) {
      return runGenerate('api', this, flags, framework);
    },
  });

  const routes = buildRouteMap({
    routes: { sdk, api },
    docs: {
      brief: 'Scaffold ParaSpell XCM SDK and XCM API starter apps',
    },
  });

  return buildApplication(
    routes,
    {
      name: 'create-paraspell',
      scanner: { caseStyle: 'allow-kebab-for-camel' },
    },
    {
      help: help({
        alias: 'h',
        brief: 'Print help information and exit',
        formatting: {
          useAliasInUsageLine: false,
          onlyRequiredInUsageLine: false,
          caseStyle: 'convert-camel-to-kebab',
        },
      }),
    },
  );
};

const app = createApp();

export const runFromArgv = (rawArgv: string[], ctx: TRunContext) => {
  return run(app, rawArgv, {
    process,
    root: ctx.root,
    consumer: ctx.consumer ?? false,
  });
};

export const runCli = async (rawArgv: string[]) => {
  if (rawArgv.length === 0) {
    await runInteractiveGenerate();
    return;
  }

  await runFromArgv(rawArgv, {
    root: process.cwd(),
    consumer: true,
  });
};
