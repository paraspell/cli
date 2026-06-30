import { describe, expect, it } from 'vitest';
import { applyFeatureFlags, resolveFeatureFlags } from './feature-flags.js';

describe('feature flags', () => {
  it('allows EVM without Snowbridge', () => {
    expect(resolveFeatureFlags({ evm: true, swap: false, snowbridge: false })).toEqual({
      evm: true,
      swap: false,
      snowbridge: false,
      evmWallet: true,
    });
  });

  it('allows Snowbridge without EVM', () => {
    expect(resolveFeatureFlags({ evm: false, swap: false, snowbridge: true })).toEqual({
      evm: false,
      swap: false,
      snowbridge: true,
      evmWallet: true,
    });
  });

  it('enables both extensions independently', () => {
    expect(resolveFeatureFlags({ evm: true, swap: false, snowbridge: true })).toEqual({
      evm: true,
      swap: false,
      snowbridge: true,
      evmWallet: true,
    });
  });

  it('applyFeatureFlags normalizes valid combinations', () => {
    expect(
      applyFeatureFlags({ evm: true, swap: true, snowbridge: false }),
    ).toMatchObject({ evm: true, swap: true, snowbridge: false, evmWallet: true });
  });
});
