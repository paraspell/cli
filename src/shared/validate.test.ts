import { describe, expect, it } from 'vitest';
import {
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

  it('rejects values that are not a BIP39 phrase or //Dev URI', () => {
    expect(validateSubstrateMnemonic(VALID_PRIVATE_KEY)).toMatch(/BIP39 phrase/);
    expect(validateSubstrateMnemonic('seed')).toMatch(/BIP39 phrase/);
    expect(validateSubstrateMnemonic('not a valid mnemonic')).toMatch(/BIP39 phrase/);
  });
});
