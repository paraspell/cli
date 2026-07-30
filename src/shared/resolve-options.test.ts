import { describe, expect, it } from 'vitest';
import {
  applyGenerateDefaults,
  hasRejectedSecrets,
} from './resolve-options.js';

const privateKey = `0x${'a'.repeat(64)}`;

describe('resolve options', () => {
  it('applies defaults and filters secrets by target', () => {
    expect(
      applyGenerateDefaults({
        kind: 'api',
        framework: 'react',
        extensions: { evm: true },
        privateKey,
        substrateMnemonic: '//Alice',
      }),
    ).toEqual({
      name: 'my-xcm-api-app',
      client: 'papi',
      extensions: { evm: true, swap: false, snowbridge: false },
      packageManager: 'pnpm',
      privateKey: undefined,
      substrateMnemonic: undefined,
    });
  });

  it('detects rejected secrets', () => {
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        privateKey: 'invalid',
      }),
    ).toBe(true);
    expect(
      hasRejectedSecrets({
        kind: 'sdk',
        framework: 'node',
        extensions: {},
        privateKey,
        substrateMnemonic: '//Alice',
      }),
    ).toBe(false);
  });
});
