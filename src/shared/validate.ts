import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import validateNpmPackageName from 'validate-npm-package-name';

const EVM_PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

const SUBSTRATE_DEV_URI_PATTERN =
  /^\/\/[A-Za-z][A-Za-z0-9]*(?:\/\/[A-Za-z][A-Za-z0-9]*)*$/;

export const validateEvmPrivateKey = (value: string): true | string => {
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (!EVM_PRIVATE_KEY_PATTERN.test(trimmed)) {
    return 'Private key must be 0x-prefixed hex (64 characters).';
  }

  return true;
};

const isSubstrateSecret = (value: string): boolean =>
  SUBSTRATE_DEV_URI_PATTERN.test(value) || validateMnemonic(value, wordlist);

export const validateSubstrateMnemonic = (value: string): true | string => {
  const trimmed = value.trim();
  if (!trimmed || isSubstrateSecret(trimmed)) return true;

  return 'Substrate mnemonic must be a BIP39 phrase (12-24 lowercase words) or a //Dev URI like //Alice.';
};

export const validateNameInput = (name: string): true | string => {
  const { validForNewPackages, errors, warnings } = validateNpmPackageName(
    name.trim(),
  );
  return validForNewPackages
    ? true
    : `Invalid project name: ${errors?.[0] ?? warnings?.[0] ?? name}`;
};
