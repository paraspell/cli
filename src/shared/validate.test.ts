import { describe, expect, it } from 'vitest';
import {
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';

describe('input validation', () => {
  it.each([
    ['', true],
    [`0x${'a'.repeat(64)}`, true],
    ['0xabc', 'Private key must be 0x-prefixed hex (64 characters).'],
  ])('validates EVM private keys', (value, expected) => {
    expect(validateEvmPrivateKey(value)).toBe(expected);
  });

  it.each([
    ['', true],
    ['//Alice//stash', true],
    ['word '.repeat(11) + 'word', true],
    [
      'invalid phrase',
      'Substrate mnemonic must be a BIP39 phrase (12–24 lowercase words) or a //Dev URI like //Alice.',
    ],
  ])('validates Substrate secrets', (value, expected) => {
    expect(validateSubstrateMnemonic(value)).toBe(expected);
  });

  it('validates project names', () => {
    expect(validateNameInput('valid-package')).toBe(true);
    expect(validateNameInput('  ')).toBe('Project name is required.');
    expect(validateNameInput('Invalid Name')).toMatch(/^Invalid project name:/);
  });
});
