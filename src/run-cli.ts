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
  type InputParser,
  run,
  type TypedFlagParameter,
} from '@stricli/core';
import { runInteractiveGenerate } from './interactive.js';
import {
  frameworkPositional,
  packageManagerFlag,
} from './shared/cli-params.js';
import { CLI_INTRO } from './shared/messages.js';
import {
  DEFAULT_FRAMEWORK,
  EXTENSION_KEYS,
  FRAMEWORKS,
  resolveExtensions,
  SDK_CLIENTS,
  type TExtensionKey,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from './shared/project-options.js';
import { runProjectFlow } from './shared/project-flow.js';
import type { TResolveInput } from './shared/types.js';
import { validateProjectTarget } from './shared/utils.js';
import { validateNameInput } from './shared/validate.js';

interface TAppContext extends CommandContext {
  root: string;
  consumer: boolean;
}

export type TRunContext = {
  root: string;
  consumer?: boolean;
};

type TCliSharedFlags = {
  name?: string;
  framework?: TFramework;
  extensions?: readonly TExtensionKey[];
  packageManager?: TPackageManager;
  out?: string;
  privateKey?: string;
  substrateMnemonic?: string;
};

type TSdkFlags = TCliSharedFlags & { client?: TSdkClient };
type TApiFlags = TCliSharedFlags;

const parseNameArg = (value: string): string => {
  const result = validateNameInput(value);
  if (result !== true) throw new Error(result);
  return value;
};

const parsedStringFlag = (
  brief: string,
  parse: InputParser<string> = (value) => value,
): TypedFlagParameter<string | undefined> => ({
  kind: 'parsed',
  parse,
  brief,
  optional: true,
});

const sharedFlagParams: FlagParametersForType<TCliSharedFlags> = {
  name: parsedStringFlag('Project name', parseNameArg),
  framework: {
    kind: 'enum',
    values: FRAMEWORKS,
    brief: 'Target framework: react | vue | node',
    optional: true,
  },
  extensions: {
    kind: 'enum',
    values: EXTENSION_KEYS,
    variadic: ',',
    brief: 'Extensions: evm, swap, snowbridge',
    optional: true,
  },
  packageManager: packageManagerFlag,
  out: parsedStringFlag('Output directory'),
  privateKey: parsedStringFlag(
    'EVM wallet key for node when using EVM or Snowbridge origins',
  ),
  substrateMnemonic: parsedStringFlag(
    'Substrate mnemonic or //Dev URI for node',
  ),
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

const defaultInternalOut = (
  root: string,
  kind: TProjectType,
  framework: TFramework,
  name: string,
): string => path.join(root, 'generated', `xcm-${kind}`, framework, name);

const runGenerate = async (
  kind: TProjectType,
  ctx: TAppContext,
  flags: TSdkFlags,
  positionalFramework?: TFramework,
): Promise<Error | void> => {
  try {
    const framework =
      flags.framework ?? positionalFramework ?? DEFAULT_FRAMEWORK;
    const extensions = flags.extensions ?? [];
    const input: TResolveInput = {
      kind,
      framework,
      name: flags.name,
      client: kind === 'sdk' ? flags.client : undefined,
      extensions:
        extensions.length > 0 ? resolveExtensions({}, extensions) : {},
      packageManager: flags.packageManager,
      privateKey: flags.privateKey,
      substrateMnemonic: flags.substrateMnemonic,
    };
    const interactive = process.stdin.isTTY === true;
    const resolveOut = (name: string): string =>
      ctx.consumer || flags.out !== undefined
        ? path.resolve(ctx.root, flags.out ?? name)
        : defaultInternalOut(ctx.root, kind, framework, name);

    if (ctx.consumer && interactive) intro(CLI_INTRO);
    await runProjectFlow({
      input,
      resolveOut,
      validateTarget: ctx.consumer ? validateProjectTarget : undefined,
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
