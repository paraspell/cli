import { describe, expect, it, vi } from 'vitest';
import {
  parseSecretFlag,
  validateEvmPrivateKey,
  validateSubstrateMnemonic,
} from './validate.js';

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const VALID_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('validateEvmPrivateKey', () => {
  it('accepts empty input', () => {
    expect(validateEvmPrivateKey('')).toBe(true);
    expect(validateEvmPrivateKey('   ')).toBe(true);
  });

  it('accepts a valid 0x-prefixed key', () => {
    expect(validateEvmPrivateKey(VALID_PRIVATE_KEY)).toBe(true);
  });

  it('rejects invalid keys', () => {
    expect(validateEvmPrivateKey('0xabc')).toMatch(/64 characters/);
    expect(validateEvmPrivateKey('abc')).toMatch(/64 characters/);
    expect(validateEvmPrivateKey('0x' + 'g'.repeat(64))).toMatch(/64 characters/);
  });
});

describe('validateSubstrateMnemonic', () => {
  it('accepts empty input', () => {
    expect(validateSubstrateMnemonic('')).toBe(true);
  });

  it('accepts //Dev URIs', () => {
    expect(validateSubstrateMnemonic('//Alice')).toBe(true);
    expect(validateSubstrateMnemonic('//Alice//stash')).toBe(true);
  });

  it('accepts BIP39 mnemonics', () => {
    expect(validateSubstrateMnemonic(VALID_MNEMONIC)).toBe(true);
  });

  it('rejects EVM private keys and other invalid values', () => {
    expect(validateSubstrateMnemonic(VALID_PRIVATE_KEY)).toMatch(/EVM private key/);
    expect(validateSubstrateMnemonic('seed')).toMatch(/BIP39 phrase/);
    expect(validateSubstrateMnemonic('not a valid mnemonic')).toMatch(/BIP39 phrase/);
  });
});

describe('parseSecretFlag', () => {
  it('returns the value when valid', () => {
    expect(
      parseSecretFlag('--private-key', VALID_PRIVATE_KEY, validateEvmPrivateKey),
    ).toBe(VALID_PRIVATE_KEY);
  });

  it('warns and returns undefined when invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseSecretFlag('--private-key', '0xabc', validateEvmPrivateKey)).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/ignoring invalid --private-key/),
    );
    vi.restoreAllMocks();
  });
});
