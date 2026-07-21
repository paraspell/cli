import { log } from '@clack/prompts';
import { styleText } from 'node:util';
import { applyFeatureFlags } from './feature-flags.js';
import { SDK_CLIENT_LABELS } from './types.js';
import type { FeatureFlags, ResolveInput, SdkClient } from './types.js';
import {
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';

const SECRET_ANSWER = '(provided via CLI)';

export const formatClientLabel = (client: SdkClient): string => {
  return SDK_CLIENT_LABELS[client];
};

export const formatFeatureFlags = (flags: FeatureFlags): string => {
  const parts: string[] = [];
  if (flags.evm) parts.push('EVM');
  if (flags.swap) parts.push('Swap');
  if (flags.snowbridge) parts.push('Snowbridge');
  return parts.length > 0 ? parts.join(', ') : 'none';
};

type ResolvedLogLine = { message: string; answer: string };

const featuresProvided = (input: ResolveInput): boolean => {
  return (
    input.evm !== undefined ||
    input.swap !== undefined ||
    input.snowbridge !== undefined
  );
};

export const buildResolvedLogs = (input: ResolveInput): ResolvedLogLine[] => {
  const lines: ResolvedLogLine[] = [];

  if (input.name !== undefined && validateNameInput(input.name) === true) {
    lines.push({ message: 'Project name', answer: input.name });
  }

  if (input.packageManager !== undefined) {
    lines.push({ message: 'Package manager', answer: input.packageManager });
  }

  if (input.kind === 'sdk' && input.client !== undefined) {
    lines.push({
      message: 'JS client',
      answer: formatClientLabel(input.client),
    });
  }

  if (featuresProvided(input)) {
    const flags = applyFeatureFlags({
      evm: input.evm ?? false,
      swap: input.swap ?? false,
      snowbridge: input.snowbridge ?? false,
    });
    lines.push({
      message: 'Additional features',
      answer: formatFeatureFlags(flags),
    });
  }

  const flags = applyFeatureFlags({
    evm: input.evm ?? false,
    swap: input.swap ?? false,
    snowbridge: input.snowbridge ?? false,
  });

  if (
    input.framework === 'node' &&
    input.substrateMnemonic !== undefined &&
    validateSubstrateMnemonic(input.substrateMnemonic) === true
  ) {
    lines.push({ message: 'Substrate mnemonic', answer: SECRET_ANSWER });
  }

  if (
    input.framework === 'node' &&
    flags.evmWallet &&
    input.privateKey !== undefined &&
    validateEvmPrivateKey(input.privateKey) === true
  ) {
    lines.push({ message: 'EVM private key', answer: SECRET_ANSWER });
  }

  return lines;
};

export const logResolvedPrompts = (input: ResolveInput): void => {
  for (const line of buildResolvedLogs(input)) {
    log.success(`${line.message}: ${styleText('cyan', line.answer)}`);
  }
};
