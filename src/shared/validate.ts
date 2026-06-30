import validateNpmPackageName from 'validate-npm-package-name';

export const EVM_PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

const SUBSTRATE_DEV_URI_PATTERN =
  /^\/\/[A-Za-z][A-Za-z0-9]*(?:\/\/[A-Za-z][A-Za-z0-9]*)*$/;

const BIP39_MNEMONIC_PATTERN = /^[a-z]+(?: [a-z]+){11,23}$/;

export function validateEvmPrivateKey(value: string): true | string {
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (!EVM_PRIVATE_KEY_PATTERN.test(trimmed)) {
    return 'Private key must be 0x-prefixed hex (64 characters).';
  }

  return true;
}

export function validateSubstrateMnemonic(value: string): true | string {
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (EVM_PRIVATE_KEY_PATTERN.test(trimmed)) {
    return 'This looks like an EVM private key. Use a BIP39 mnemonic or //Dev URI (e.g. //Alice).';
  }

  if (SUBSTRATE_DEV_URI_PATTERN.test(trimmed) || BIP39_MNEMONIC_PATTERN.test(trimmed)) {
    return true;
  }

  return 'Substrate mnemonic must be a BIP39 phrase (12–24 lowercase words) or a //Dev URI like //Alice.';
}

export function parseSecretFlag(
  flag: string,
  value: string,
  validate: (value: string) => true | string,
): string | undefined {
  const result = validate(value);
  if (result !== true) {
    console.warn(`Warning: ignoring invalid ${flag}. ${result}`);
    return undefined;
  }
  return value;
}

export function validateNpmName(name: string): boolean {
  return validateNpmPackageName(name).validForNewPackages === true;
}

export function validateNameInput(name: string): true | string {
  const trimmed = name.trim();
  if (!trimmed) return 'Project name is required.';

  const result = validateNpmPackageName(trimmed);
  if (result.validForNewPackages) return true;

  const reason = result.errors?.[0] ?? result.warnings?.[0];
  return reason
    ? `Invalid project name: ${reason}`
    : `Invalid project name: ${name}`;
}
