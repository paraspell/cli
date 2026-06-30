import fs from 'node:fs';
import path from 'node:path';
import { runInteractiveGenerate } from './interactive.js';
import { API_FRAMEWORKS, SDK_FRAMEWORKS } from './shared/frameworks.js';
import { generateApiApp, generateSdkApp } from './shared/hygen-runner.js';
import { printNextSteps } from './shared/next-steps.js';
import {
  assertNoStrayPositional,
  argvHasFlag,
  getArgvFlag,
  hasRejectedCliSecrets,
  parseApiArgv,
  parseSdkArgv,
  printApiHelp,
  printMainHelp,
  printSdkHelp,
  shiftPositionalFramework,
  shiftPositionalType,
} from './shared/parse-cli-args.js';
import { apiNeedsInteractive, promptApiOptions } from './shared/prompt-api.js';
import { promptSdkOptions, sdkNeedsInteractive } from './shared/prompt-sdk.js';
import type {
  ApiGenerateOptions,
  Framework,
  ProjectType,
  SdkGenerateOptions,
} from './shared/types.js';
import { UserError } from './shared/errors.js';
import { validateNameInput } from './shared/validate.js';

function consumerNameValidator(
  argv: string[],
  root: string,
  parsedOut: string,
): (name: string) => true | string {
  return (name) => {
    const base = validateNameInput(name);
    if (base !== true) return base;
    const out = resolveConsumerOut(argv, root, name, parsedOut);
    if (fs.existsSync(out)) return `Project already exists: ${out}`;
    return true;
  };
}

function argvHasOut(argv: string[]): boolean {
  return argv.some((a) => a === '--out' || a.startsWith('--out='));
}

function resolveConsumerOut(
  argv: string[],
  root: string,
  name: string,
  parsedOut: string,
): string {
  if (argvHasOut(argv)) return parsedOut;
  return path.join(root, name);
}

function assertConsumerProject(name: string, outDir: string): void {
  const nameError = validateNameInput(name);
  if (nameError !== true) {
    throw new UserError(nameError);
  }
  if (fs.existsSync(outDir)) {
    throw new UserError(`Project already exists: ${outDir}`);
  }
}

function wantsNonInteractive(argv: string[]): boolean {
  const type = shiftPositionalType([...argv]).type ?? parseProjectTypeFlag(argv);
  return type !== null;
}

function parseProjectTypeFlag(argv: string[]): ProjectType | null {
  const raw = getArgvFlag(argv, 'type');
  if (raw === 'sdk' || raw === 'api') return raw;
  return null;
}

type RunContext = { root: string; templatesRoot: string; consumer?: boolean };

async function runFromArgv(
  kind: ProjectType,
  rawArgv: string[],
  ctx: RunContext,
): Promise<void> {
  const { argv, framework: positional } = shiftPositionalFramework(rawArgv);
  assertNoStrayPositional(argv, positional);
  const parseCtx = {
    root: ctx.root,
    framework: positional ?? 'react',
    frameworkFlag: true,
  };

  let opts: SdkGenerateOptions | ApiGenerateOptions =
    kind === 'sdk' ? parseSdkArgv(argv, parseCtx) : parseApiArgv(argv, parseCtx);

  if (opts.help) {
    const helpCommand = ctx.consumer ? `create-paraspell ${kind}` : undefined;
    if (kind === 'sdk') printSdkHelp(helpCommand);
    else printApiHelp(helpCommand);
    return;
  }

  const rejectedSecrets = hasRejectedCliSecrets(argv, opts);
  if (rejectedSecrets && !process.stdin.isTTY) {
    throw new UserError(
      'Invalid --private-key or --substrate-mnemonic value. Fix the flag value, or omit it and run on a TTY to enter secrets interactively.',
    );
  }

  const needsInteractive =
    rejectedSecrets ||
    (kind === 'sdk'
      ? sdkNeedsInteractive(argv, opts as SdkGenerateOptions)
      : apiNeedsInteractive(argv, opts));
  if (needsInteractive) {
    const validateName = ctx.consumer
      ? consumerNameValidator(argv, ctx.root, opts.out)
      : undefined;
    const provided = {
      framework: positional !== null || argvHasFlag(argv, 'framework'),
    };
    const answers =
      kind === 'sdk'
        ? await promptSdkOptions(opts as SdkGenerateOptions, {
            validateName,
            argv,
            provided,
          })
        : await promptApiOptions(opts, { validateName, argv, provided });
    opts = { ...opts, ...answers };
  }

  if (ctx.consumer) {
    opts.out = resolveConsumerOut(argv, ctx.root, opts.name, opts.out);
    assertConsumerProject(opts.name, opts.out);
  }

  if (kind === 'sdk') {
    await generateSdkApp({
      meta: SDK_FRAMEWORKS[opts.framework],
      templatesRoot: ctx.templatesRoot,
      opts: opts as SdkGenerateOptions,
    });
  } else {
    await generateApiApp({
      meta: API_FRAMEWORKS[opts.framework],
      templatesRoot: ctx.templatesRoot,
      opts,
    });
  }

  if (ctx.consumer) {
    printNextSteps(opts.out, opts.packageManager, opts.framework);
  }
}

export async function runSdkFromArgv(
  rawArgv: string[],
  ctx: RunContext,
): Promise<void> {
  return runFromArgv('sdk', rawArgv, ctx);
}

export async function runApiFromArgv(
  rawArgv: string[],
  ctx: RunContext,
): Promise<void> {
  return runFromArgv('api', rawArgv, ctx);
}

export async function runCli(
  rawArgv: string[],
  templatesRoot: string,
): Promise<void> {
  const cwd = process.cwd();

  if (rawArgv.length === 0) {
    await runInteractiveGenerate(templatesRoot);
    return;
  }

  if (getArgvFlag(rawArgv, 'help') === true && !wantsNonInteractive(rawArgv)) {
    printMainHelp();
    return;
  }

  const { argv, type: positionalType } = shiftPositionalType(rawArgv);
  const projectType = positionalType ?? parseProjectTypeFlag(argv);

  if (!projectType) {
    if (rawArgv.some((a) => a.startsWith('--'))) {
      console.error(
        'Non-interactive mode requires --type sdk|api or a leading sdk|api subcommand.\n',
      );
      printMainHelp();
      process.exit(1);
    }
    await runInteractiveGenerate(templatesRoot);
    return;
  }

  const ctx: RunContext = { root: cwd, templatesRoot, consumer: true };

  if (projectType === 'sdk') {
    await runSdkFromArgv(argv, ctx);
  } else {
    await runApiFromArgv(argv, ctx);
  }
}
