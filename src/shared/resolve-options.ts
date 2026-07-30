import {
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_SDK_CLIENT,
  PROJECT_TYPE_OPTIONS,
  requiresEvmWallet,
  resolveExtensions,
} from './project-options.js';
import { type TResolveInput, type TResolvedOptions } from './types.js';
import {
  validateEvmPrivateKey,
  validateSubstrateMnemonic,
} from './validate.js';

const validSecret = (
  value: string | undefined,
  validate: (value: string) => true | string,
): string | undefined =>
  value !== undefined && validate(value) === true ? value : undefined;

export const hasRejectedSecrets = (input: TResolveInput): boolean => {
  return (
    (input.privateKey !== undefined &&
      validateEvmPrivateKey(input.privateKey) !== true) ||
    (input.substrateMnemonic !== undefined &&
      validateSubstrateMnemonic(input.substrateMnemonic) !== true)
  );
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
