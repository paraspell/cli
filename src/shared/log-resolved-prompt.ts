import figures from '@inquirer/figures';
import { styleText } from 'node:util';
import { applyFeatureFlags } from './feature-flags.js';
import {
  argvHasAnyFeatureFlag,
  argvHasAcceptedName,
  argvHasFlag,
} from './parse-cli-args.js';
import type { ApiGenerateOptions, FeatureFlags, Framework, SdkClient, SdkGenerateOptions } from './types.js';

const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: 'Vite - React',
  vue: 'Vite - Vue',
  node: 'NodeJS',
};

const CLIENT_LABELS: Record<SdkClient, string> = {
  papi: 'Polkadot API',
  pjs: 'Polkadot JS',
  dedot: 'Dedot',
};

const SECRET_ANSWER = styleText('dim', '(provided via CLI)');

export function formatFrameworkLabel(framework: Framework): string {
  return FRAMEWORK_LABELS[framework];
}

export function formatClientLabel(client: SdkClient): string {
  return CLIENT_LABELS[client];
}

export function formatFeatureFlags(flags: FeatureFlags): string {
  const parts: string[] = [];
  if (flags.evm) parts.push('EVM');
  if (flags.swap) parts.push('Swap');
  if (flags.snowbridge) parts.push('Snowbridge');
  return parts.length > 0 ? parts.join(', ') : 'none';
}

export function logResolvedPrompt(message: string, answer: string): void {
  console.log(
    `${styleText('green', figures.tick)} ${message} ${styleText('cyan', answer)}`,
  );
}

export function logResolvedSecret(message: string): void {
  logResolvedPrompt(message, SECRET_ANSWER);
}

type ResolvedLogLine = { message: string; answer: string };

type LogArgvResolvedInput = {
  argv: string[];
  partial: Partial<SdkGenerateOptions | ApiGenerateOptions>;
  provided?: { framework?: boolean };
  kind: 'sdk' | 'api';
  defaultName: string;
};

export function buildArgvResolvedLogs(input: LogArgvResolvedInput): ResolvedLogLine[] {
  const { argv, partial, provided, kind, defaultName } = input;
  const lines: ResolvedLogLine[] = [];

  if (argvHasAcceptedName(argv, partial.name)) {
    lines.push({
      message: 'Enter the project name',
      answer: partial.name ?? defaultName,
    });
  }

  if (provided?.framework && partial.framework) {
    lines.push({
      message: 'Select the desired framework',
      answer: formatFrameworkLabel(partial.framework),
    });
  }

  if (argvHasFlag(argv, 'package-manager')) {
    lines.push({
      message: 'Select the desired package manager',
      answer: partial.packageManager ?? 'pnpm',
    });
  }

  if (kind === 'sdk' && argvHasFlag(argv, 'client')) {
    const client = (partial as Partial<SdkGenerateOptions>).client ?? 'pjs';
    lines.push({
      message: 'Select the desired JS client type',
      answer: formatClientLabel(client),
    });
  }

  if (argvHasAnyFeatureFlag(argv)) {
    const featureFlags = applyFeatureFlags({
      evm: partial.evm ?? false,
      swap: partial.swap ?? false,
      snowbridge: partial.snowbridge ?? false,
    });
    lines.push({
      message: 'Select the desired additional features',
      answer: formatFeatureFlags(featureFlags),
    });
  }

  if (partial.framework === 'node' && partial.substrateMnemonic !== undefined) {
    lines.push({
      message: 'Your Substrate wallet mnemonic for setup',
      answer: SECRET_ANSWER,
    });
  }

  const featureFlags = applyFeatureFlags({
    evm: partial.evm ?? false,
    swap: partial.swap ?? false,
    snowbridge: partial.snowbridge ?? false,
  });
  if (
    partial.framework === 'node' &&
    featureFlags.evmWallet &&
    partial.privateKey !== undefined
  ) {
    lines.push({
      message: 'Your EVM wallet private key for setup',
      answer: SECRET_ANSWER,
    });
  }

  return lines;
}

export function logArgvResolvedPrompts(input: LogArgvResolvedInput): void {
  const lines = buildArgvResolvedLogs(input);
  if (lines.length === 0) return;
  for (const line of lines) {
    logResolvedPrompt(line.message, line.answer);
  }
  console.log();
}
