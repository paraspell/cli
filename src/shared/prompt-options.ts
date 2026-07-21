import {
  applyFeatureFlags,
  type ResolvedFeatureFlags,
} from './feature-flags.js';
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from './feature-extensions-checkbox.js';
import { logResolvedPrompts } from './log-resolved-prompt.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './prompt-secrets.js';
import { promptClient, promptName, promptPackageManager } from './prompts.js';
import type {
  ProjectType,
  ResolveInput,
  ResolvedOptions,
} from './types.js';
import {
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';

export type NameValidator = (name: string) => true | string;

type PromptGenerateOptions = {
  validateName?: NameValidator;
};

const DEFAULT_NAME: Record<ProjectType, string> = {
  sdk: 'my-xcm-app',
  api: 'my-xcm-api-app',
};

const featuresProvided = (input: ResolveInput): boolean => {
  return (
    input.evm !== undefined ||
    input.swap !== undefined ||
    input.snowbridge !== undefined
  );
};

const validSecret = (
  value: string | undefined,
  validate: (value: string) => true | string,
): string | undefined => {
  if (value === undefined) return undefined;
  return validate(value) === true ? value : undefined;
};

export const hasRejectedSecrets = (input: ResolveInput): boolean => {
  return (
    (input.privateKey !== undefined &&
      validateEvmPrivateKey(input.privateKey) !== true) ||
    (input.substrateMnemonic !== undefined &&
      validateSubstrateMnemonic(input.substrateMnemonic) !== true)
  );
};

export const generateNeedsInteractive = (input: ResolveInput): boolean => {
  if (!process.stdin.isTTY) return false;
  if (input.packageManager === undefined) return true;
  if (input.kind === 'sdk' && input.client === undefined) return true;
  if (!featuresProvided(input)) return true;
  if (input.name === undefined) return true;
  if (validateNameInput(input.name) !== true) return true;

  const features = applyFeatureFlags({
    evm: input.evm ?? false,
    swap: input.swap ?? false,
    snowbridge: input.snowbridge ?? false,
  });
  if (input.framework === 'node' && input.substrateMnemonic === undefined) {
    return true;
  }
  if (
    input.framework === 'node' &&
    features.evmWallet &&
    input.privateKey === undefined
  ) {
    return true;
  }
  return false;
};

const resolveFeatures = async (
  input: ResolveInput,
): Promise<ResolvedFeatureFlags> => {
  if (featuresProvided(input)) {
    return applyFeatureFlags({
      evm: input.evm ?? false,
      swap: input.swap ?? false,
      snowbridge: input.snowbridge ?? false,
    });
  }
  const selected = await promptFeatureExtensions({
    evm: input.evm,
    swap: input.swap,
    snowbridge: input.snowbridge,
  });
  return applyFeatureFlags({
    evm: selected.includes(EVM_EXTENSION),
    swap: selected.includes(SWAP_EXTENSION),
    snowbridge: selected.includes(SNOWBRIDGE_EXTENSION),
  });
};

const resolveSecret = async (
  provided: string | undefined,
  flagName: string,
  validate: (value: string) => true | string,
  promptFn: () => Promise<string | undefined>,
  applies: boolean,
): Promise<string | undefined> => {
  if (!applies) return undefined;
  if (provided !== undefined) {
    const result = validate(provided);
    if (result === true) return provided;
    console.warn(`Warning: ignoring invalid ${flagName}. ${result}`);
  }
  return promptFn();
};

export const promptGenerateOptions = async (
  input: ResolveInput,
  options: PromptGenerateOptions = {},
): Promise<ResolvedOptions> => {
  logResolvedPrompts(input);

  const name =
    input.name ??
    (await promptName(
      DEFAULT_NAME[input.kind],
      options.validateName ?? validateNameInput,
    ));

  const packageManager =
    input.packageManager ?? (await promptPackageManager('pnpm'));

  const client =
    input.kind === 'sdk'
      ? (input.client ?? (await promptClient('pjs')))
      : undefined;

  const features = await resolveFeatures(input);
  const isNode = input.framework === 'node';

  const substrateMnemonic = await resolveSecret(
    input.substrateMnemonic,
    '--substrate-mnemonic',
    validateSubstrateMnemonic,
    promptSubstrateMnemonic,
    isNode,
  );

  const privateKey = await resolveSecret(
    input.privateKey,
    '--private-key',
    validateEvmPrivateKey,
    promptEvmPrivateKey,
    isNode && features.evmWallet,
  );

  return {
    name,
    client,
    evm: features.evm,
    swap: features.swap,
    snowbridge: features.snowbridge,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
};

export const applyGenerateDefaults = (input: ResolveInput): ResolvedOptions => {
  const name = input.name ?? DEFAULT_NAME[input.kind];
  const packageManager = input.packageManager ?? 'pnpm';
  const client =
    input.kind === 'sdk' ? (input.client ?? 'pjs') : undefined;

  const features = applyFeatureFlags({
    evm: input.evm ?? false,
    swap: input.swap ?? false,
    snowbridge: input.snowbridge ?? false,
  });
  const isNode = input.framework === 'node';

  const substrateMnemonic = isNode
    ? validSecret(input.substrateMnemonic, validateSubstrateMnemonic)
    : undefined;
  const privateKey =
    isNode && features.evmWallet
      ? validSecret(input.privateKey, validateEvmPrivateKey)
      : undefined;

  return {
    name,
    client,
    evm: features.evm,
    swap: features.swap,
    snowbridge: features.snowbridge,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
};
