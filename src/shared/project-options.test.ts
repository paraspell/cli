import { describe, expect, it } from 'vitest';
import {
  packageScriptCommand,
  requiresEvmWallet,
  resolveExtensions,
} from './project-options.js';

describe('project options', () => {
  it('builds package script commands', () => {
    expect(packageScriptCommand('npm', 'dev')).toBe('npm run dev');
    expect(packageScriptCommand('npm', 'start')).toBe('npm start');
    expect(packageScriptCommand('pnpm', 'dev')).toBe('pnpm dev');
  });

  it('merges explicit and selected extensions', () => {
    expect(resolveExtensions({ evm: false }, ['evm', 'swap'])).toEqual({
      evm: false,
      swap: true,
      snowbridge: false,
    });
  });

  it('identifies extensions that require an EVM wallet', () => {
    expect(
      requiresEvmWallet({ evm: false, swap: true, snowbridge: false }),
    ).toBe(false);
    expect(
      requiresEvmWallet({ evm: true, swap: false, snowbridge: false }),
    ).toBe(true);
    expect(
      requiresEvmWallet({ evm: false, swap: false, snowbridge: true }),
    ).toBe(true);
  });
});
