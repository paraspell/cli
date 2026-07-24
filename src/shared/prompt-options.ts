import {
  EVM_EXTENSION,
  promptExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from './extensions-checkbox.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './prompt-secrets.js';
import { promptClient, promptName, promptPackageManager } from './prompts.js';
import {
  EXTENSION_KEYS,
  type TExtensions,
  type TProjectType,
  type TResolveInput,
  type TResolvedOptions,
} from './types.js';
import {
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';

export type TNameValidator = (name: string) => true | string;

type TPromptGenerateOptions = {
  validateName?: TNameValidator;
};

const DEFAULT_NAME: Record<TProjectType, string> = {
  sdk: 'my-xcm-app',
  api: 'my-xcm-api-app',
};

const extensionsProvided = (input: TResolveInput): boolean => {
  return EXTENSION_KEYS.some(
    (extension) => input.extensions[extension] !== undefined,
  );
};

const validSecret = (
  value: string | undefined,
  validate: (value: string) => true | string,
): string | undefined => {
  if (value === undefined) return undefined;
  return validate(value) === true ? value : undefined;
};

export const hasRejectedSecrets = (input: TResolveInput): boolean => {
  return (
    (input.privateKey !== undefined &&
      validateEvmPrivateKey(input.privateKey) !== true) ||
    (input.substrateMnemonic !== undefined &&
      validateSubstrateMnemonic(input.substrateMnemonic) !== true)
  );
};

const resolveExtensions = async (
  input: TResolveInput,
): Promise<TExtensions> => {
  if (extensionsProvided(input)) {
    return {
      evm: input.extensions.evm ?? false,
      swap: input.extensions.swap ?? false,
      snowbridge: input.extensions.snowbridge ?? false,
    };
  }
  const selected = await promptExtensions(input.extensions);
  return {
    evm: selected.includes(EVM_EXTENSION),
    swap: selected.includes(SWAP_EXTENSION),
    snowbridge: selected.includes(SNOWBRIDGE_EXTENSION),
  };
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
  input: TResolveInput,
  options: TPromptGenerateOptions = {},
): Promise<TResolvedOptions> => {
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

  const extensions = await resolveExtensions(input);
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
    isNode && (extensions.evm || extensions.snowbridge),
  );

  return {
    name,
    client,
    extensions,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
};

export const applyGenerateDefaults = (
  input: TResolveInput,
): TResolvedOptions => {
  const name = input.name ?? DEFAULT_NAME[input.kind];
  const packageManager = input.packageManager ?? 'pnpm';
  const client = input.kind === 'sdk' ? (input.client ?? 'pjs') : undefined;

  const extensions: TExtensions = {
    evm: input.extensions.evm ?? false,
    swap: input.extensions.swap ?? false,
    snowbridge: input.extensions.snowbridge ?? false,
  };
  const isNode = input.framework === 'node';

  const substrateMnemonic = isNode
    ? validSecret(input.substrateMnemonic, validateSubstrateMnemonic)
    : undefined;
  const privateKey =
    isNode && (extensions.evm || extensions.snowbridge)
      ? validSecret(input.privateKey, validateEvmPrivateKey)
      : undefined;

  return {
    name,
    client,
    extensions,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
};
