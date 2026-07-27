import { group, log } from '@clack/prompts';
import { promptExtensions } from './extensions-checkbox.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './prompt-secrets.js';
import {
  promptClient,
  promptConfigureWallet,
  promptName,
  promptPackageManager,
} from './prompts.js';
import {
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_SDK_CLIENT,
  EXTENSION_KEYS,
  PROJECT_TYPE_OPTIONS,
  requiresEvmWallet,
  resolveExtensions,
} from './project-options.js';
import { type TResolveInput, type TResolvedOptions } from './types.js';
import {
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';

export type TNameValidator = (name: string) => true | string;

type TPromptGenerateOptions = {
  validateName?: TNameValidator;
};

const extensionsProvided = (input: TResolveInput): boolean =>
  EXTENSION_KEYS.some((extension) => input.extensions[extension] !== undefined);

const validSecret = (
  value: string | undefined,
  validate: (value: string) => true | string,
): string | undefined =>
  value !== undefined && validate(value) === true ? value : undefined;

const validateProvidedSecret = (
  value: string | undefined,
  flagName: string,
  validate: (value: string) => true | string,
): string | undefined => {
  if (value === undefined) return undefined;
  const result = validate(value);
  if (result === true) return value;
  log.warn(`Ignoring invalid ${flagName}. ${result}`);
  return undefined;
};

export const hasRejectedSecrets = (input: TResolveInput): boolean => {
  return (
    (input.privateKey !== undefined &&
      validateEvmPrivateKey(input.privateKey) !== true) ||
    (input.substrateMnemonic !== undefined &&
      validateSubstrateMnemonic(input.substrateMnemonic) !== true)
  );
};

export const promptGenerateOptions = async (
  input: TResolveInput,
  options: TPromptGenerateOptions = {},
): Promise<TResolvedOptions> => {
  const isNode = input.framework === 'node';
  const providedSubstrateMnemonic = validateProvidedSecret(
    input.substrateMnemonic,
    '--substrate-mnemonic',
    validateSubstrateMnemonic,
  );
  const providedPrivateKey = validateProvidedSecret(
    input.privateKey,
    '--private-key',
    validateEvmPrivateKey,
  );

  const answers = await group({
    client: () =>
      input.kind === 'sdk' && input.client === undefined
        ? promptClient()
        : undefined,
    extensions: () =>
      extensionsProvided(input)
        ? undefined
        : promptExtensions(input.extensions),
    name: () =>
      input.name === undefined
        ? promptName(
            PROJECT_TYPE_OPTIONS[input.kind].defaultName,
            options.validateName ?? validateNameInput,
          )
        : undefined,
    packageManager: () =>
      input.packageManager === undefined
        ? promptPackageManager(DEFAULT_PACKAGE_MANAGER)
        : undefined,
    configureWallet: ({ results }) => {
      const extensions = resolveExtensions(
        input.extensions,
        results.extensions,
      );
      const needsPrivateKey =
        requiresEvmWallet(extensions) && providedPrivateKey === undefined;
      const needsWalletSetup =
        isNode && (providedSubstrateMnemonic === undefined || needsPrivateKey);
      return needsWalletSetup ? promptConfigureWallet() : undefined;
    },
    substrateMnemonic: ({ results }) =>
      isNode &&
      providedSubstrateMnemonic === undefined &&
      results.configureWallet === true
        ? promptSubstrateMnemonic()
        : undefined,
    privateKey: ({ results }) => {
      const extensions = resolveExtensions(
        input.extensions,
        results.extensions,
      );
      return isNode &&
        requiresEvmWallet(extensions) &&
        providedPrivateKey === undefined &&
        results.configureWallet === true
        ? promptEvmPrivateKey()
        : undefined;
    },
  });

  const extensions = resolveExtensions(input.extensions, answers.extensions);
  const promptedPrivateKey =
    typeof answers.privateKey === 'string' ? answers.privateKey : undefined;
  const promptedSubstrateMnemonic =
    typeof answers.substrateMnemonic === 'string'
      ? answers.substrateMnemonic
      : undefined;

  return applyGenerateDefaults({
    ...input,
    name: input.name ?? answers.name,
    client: input.client ?? answers.client,
    extensions,
    packageManager: input.packageManager ?? answers.packageManager,
    privateKey: providedPrivateKey ?? promptedPrivateKey,
    substrateMnemonic: providedSubstrateMnemonic ?? promptedSubstrateMnemonic,
  });
};

export const applyGenerateDefaults = (
  input: TResolveInput,
): TResolvedOptions => {
  const name = input.name ?? PROJECT_TYPE_OPTIONS[input.kind].defaultName;
  const packageManager = input.packageManager ?? DEFAULT_PACKAGE_MANAGER;
  const extensions = resolveExtensions(input.extensions);
  const isNode = input.framework === 'node';

  const substrateMnemonic = isNode
    ? validSecret(input.substrateMnemonic, validateSubstrateMnemonic)
    : undefined;
  const privateKey =
    isNode && requiresEvmWallet(extensions)
      ? validSecret(input.privateKey, validateEvmPrivateKey)
      : undefined;

  return {
    name,
    client: input.client ?? DEFAULT_SDK_CLIENT,
    extensions,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
};
