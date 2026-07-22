import fs from "node:fs";
import path from "node:path";
import {
  type Application,
  buildApplication,
  buildCommand,
  buildRouteMap,
  type CommandContext,
  type FlagParametersForType,
  help,
  run,
} from "@stricli/core";
import { generateApp } from "./generator/generate.js";
import { runInteractiveGenerate } from "./interactive.js";
import {
  frameworkPositional,
  packageManagerFlag,
} from "./shared/cli-params.js";
import { printNextSteps } from "./shared/next-steps.js";
import {
  applyGenerateDefaults,
  hasRejectedSecrets,
  type NameValidator,
  promptGenerateOptions,
} from "./shared/prompt-options.js";
import {
  FRAMEWORKS,
  SDK_CLIENTS,
  type Framework,
  type PackageManager,
  type ProjectType,
  type ResolveInput,
  type SdkClient,
} from "./shared/types.js";
import { validateNameInput } from "./shared/validate.js";

interface AppContext extends CommandContext {
  root: string;
  consumer: boolean;
}

export type RunContext = {
  root: string;
  consumer?: boolean;
};

type SharedFlags = {
  name?: string;
  framework?: Framework;
  evm?: boolean;
  swap?: boolean;
  snowbridge?: boolean;
  packageManager?: PackageManager;
  out?: string;
  privateKey?: string;
  substrateMnemonic?: string;
};

type SdkFlags = SharedFlags & { client?: SdkClient };
type ApiFlags = SharedFlags;

const identity = (value: string): string => value;

const parseNameArg = (value: string): string => {
  const result = validateNameInput(value);
  if (result !== true) throw new Error(result);
  return value;
};

const sharedFlagParams = {
  name: {
    kind: "parsed",
    parse: parseNameArg,
    brief: "Project name",
    optional: true,
  },
  framework: {
    kind: "enum",
    values: FRAMEWORKS,
    brief: "Target framework: react | vue | node",
    optional: true,
  },
  evm: { kind: "boolean", brief: "Enable EVM origin chains", optional: true },
  swap: {
    kind: "boolean",
    brief: "Enable cross-chain swaps (@paraspell/swap)",
    optional: true,
  },
  snowbridge: {
    kind: "boolean",
    brief: "Enable Snowbridge transfers",
    optional: true,
  },
  packageManager: packageManagerFlag,
  out: {
    kind: "parsed",
    parse: identity,
    brief: "Output directory",
    optional: true,
  },
  privateKey: {
    kind: "parsed",
    parse: identity,
    brief: "EVM wallet key for node when using EVM or Snowbridge origins",
    optional: true,
  },
  substrateMnemonic: {
    kind: "parsed",
    parse: identity,
    brief: "Substrate mnemonic or //Dev URI for node",
    optional: true,
  },
} as const satisfies FlagParametersForType<SharedFlags>;

const sdkFlagParams = {
  ...sharedFlagParams,
  client: {
    kind: "enum",
    values: SDK_CLIENTS,
    brief: "JS client: papi | pjs | dedot",
    optional: true,
  },
} as const satisfies FlagParametersForType<SdkFlags>;

const resolveOut = (root: string, out: string): string =>
  path.isAbsolute(out) ? out : path.join(root, out);

const defaultInternalOut = (
  root: string,
  kind: ProjectType,
  framework: Framework,
  name: string,
): string =>
  path.join(
    root,
    "generated",
    kind === "sdk" ? "xcm-sdk" : "xcm-api",
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
): NameValidator => {
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
  kind: ProjectType,
  ctx: AppContext,
  flags: SdkFlags,
  positionalFramework?: Framework,
): Promise<Error | void> => {
  try {
    const framework = flags.framework ?? positionalFramework ?? "react";
    const input: ResolveInput = {
      kind,
      framework,
      name: flags.name,
      client: kind === "sdk" ? flags.client : undefined,
      evm: flags.evm,
      swap: flags.swap,
      snowbridge: flags.snowbridge,
      packageManager: flags.packageManager,
      privateKey: flags.privateKey,
      substrateMnemonic: flags.substrateMnemonic,
    };

    const rejectedSecrets = hasRejectedSecrets(input);
    if (rejectedSecrets && !process.stdin.isTTY) {
      throw new Error(
        "Invalid --private-key or --substrate-mnemonic value. Fix the flag value, or omit it and run on a TTY to enter secrets interactively.",
      );
    }

    const validateName = ctx.consumer
      ? makeConsumerNameValidator(ctx.root, flags.out)
      : undefined;

    const resolved = process.stdin.isTTY
      ? await promptGenerateOptions(input, { validateName })
      : applyGenerateDefaults(input);

    const out =
      flags.out !== undefined
        ? resolveOut(ctx.root, flags.out)
        : ctx.consumer
          ? path.join(ctx.root, resolved.name)
          : defaultInternalOut(ctx.root, kind, framework, resolved.name);

    if (ctx.consumer) assertConsumerProject(resolved.name, out);

    const opts = {
      framework,
      name: resolved.name,
      evm: resolved.evm,
      swap: resolved.swap,
      snowbridge: resolved.snowbridge,
      packageManager: resolved.packageManager,
      out,
      privateKey: resolved.privateKey,
      substrateMnemonic: resolved.substrateMnemonic,
    };

    await generateApp(
      kind === "sdk"
        ? {
            kind,
            opts: { ...opts, client: resolved.client ?? "pjs" },
          }
        : { kind, opts },
    );

    if (ctx.consumer) {
      printNextSteps(out, resolved.packageManager, framework);
    }
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};

const createApp = (): Application<AppContext> => {
  const sdk = buildCommand<SdkFlags, [Framework?], AppContext>({
    docs: { brief: "Scaffold a ParaSpell XCM SDK starter app" },
    parameters: { positional: frameworkPositional, flags: sdkFlagParams },
    func(flags, framework) {
      return runGenerate("sdk", this, flags, framework);
    },
  });

  const api = buildCommand<ApiFlags, [Framework?], AppContext>({
    docs: { brief: "Scaffold a ParaSpell XCM API starter app" },
    parameters: { positional: frameworkPositional, flags: sharedFlagParams },
    func(flags, framework) {
      return runGenerate("api", this, flags, framework);
    },
  });

  const routes = buildRouteMap({
    routes: { sdk, api },
    docs: {
      brief: "Scaffold ParaSpell XCM SDK and XCM API starter apps",
    },
  });

  return buildApplication(
    routes,
    {
      name: "create-paraspell",
      scanner: { caseStyle: "allow-kebab-for-camel" },
    },
    {
      help: help({
        alias: "h",
        brief: "Print help information and exit",
        formatting: {
          useAliasInUsageLine: false,
          onlyRequiredInUsageLine: false,
          caseStyle: "convert-camel-to-kebab",
        },
      }),
    },
  );
};

const app = createApp();

export const runFromArgv = (rawArgv: string[], ctx: RunContext) => {
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
