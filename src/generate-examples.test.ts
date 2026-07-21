import { describe, expect, it } from 'vitest';
import { FEATURE_COMBOS, apiExampleName, sdkExampleDir } from './generate-examples.js';
import { SDK_CLIENTS } from './shared/types.js';

describe('feature combos', () => {
  it('defines 8 valid combinations', () => {
    expect(FEATURE_COMBOS).toHaveLength(8);
  });

  it('uses unique API example names', () => {
    const names = FEATURE_COMBOS.map(apiExampleName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses unique SDK dirs per client', () => {
    for (const client of SDK_CLIENTS) {
      const dirs = FEATURE_COMBOS.map((combo) => sdkExampleDir(client, combo));
      expect(new Set(dirs).size).toBe(dirs.length);
    }
  });

  it('names the base API example', () => {
    expect(apiExampleName(FEATURE_COMBOS[0]!)).toBe('base');
  });

  it('names snowbridge-only API examples', () => {
    expect(apiExampleName(FEATURE_COMBOS[2]!)).toBe('snowbridge');
    expect(apiExampleName(FEATURE_COMBOS[3]!)).toBe('swap-snowbridge');
  });

  it('names the full API feature set', () => {
    expect(apiExampleName(FEATURE_COMBOS[7]!)).toBe('evm-swap-snowbridge');
  });

  it('names snowbridge-only SDK dirs', () => {
    expect(sdkExampleDir('pjs', FEATURE_COMBOS[2]!)).toBe('pjs-snowbridge');
  });

  it('names the full SDK feature set', () => {
    expect(sdkExampleDir('pjs', FEATURE_COMBOS[7]!)).toBe('pjs-evm-swap-snowbridge');
  });
});
