import { describe, expect, it } from 'vitest';
import {
  isPackageManager,
  packageRunCommand,
  resolveExtensions,
} from './project-options.js';

describe('project options', () => {
  it('recognizes supported package managers', () => {
    expect(isPackageManager('pnpm')).toBe(true);
    expect(isPackageManager('deno')).toBe(false);
  });

  it('builds package run commands', () => {
    expect(packageRunCommand('npm')).toBe('npm run');
    expect(packageRunCommand('pnpm')).toBe('pnpm');
  });

  it('merges explicit and selected extensions', () => {
    expect(resolveExtensions({ evm: false }, ['evm', 'swap'])).toEqual({
      evm: false,
      swap: true,
      snowbridge: false,
    });
  });
});
