import { describe, expect, it } from 'vitest';
import {
  EXTENSION_COMBINATIONS,
  apiExampleName,
  sdkExampleDir,
} from './generate-examples.js';
import { SDK_CLIENTS } from './shared/project-options.js';

describe('extension combinations', () => {
  it('defines 8 valid combinations', () => {
    expect(EXTENSION_COMBINATIONS).toHaveLength(8);
  });

  it('uses unique API example names', () => {
    const names = EXTENSION_COMBINATIONS.map(apiExampleName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses unique SDK dirs per client', () => {
    for (const client of SDK_CLIENTS) {
      const dirs = EXTENSION_COMBINATIONS.map((extensions) =>
        sdkExampleDir(client, extensions),
      );
      expect(new Set(dirs).size).toBe(dirs.length);
    }
  });

  it('names the base API example', () => {
    expect(apiExampleName(EXTENSION_COMBINATIONS[0])).toBe('base');
  });

  it('names snowbridge-only API examples', () => {
    expect(apiExampleName(EXTENSION_COMBINATIONS[2])).toBe('snowbridge');
    expect(apiExampleName(EXTENSION_COMBINATIONS[3])).toBe('swap-snowbridge');
  });

  it('names the full API extension set', () => {
    expect(apiExampleName(EXTENSION_COMBINATIONS[7])).toBe(
      'evm-swap-snowbridge',
    );
  });

  it('names snowbridge-only SDK dirs', () => {
    expect(sdkExampleDir('pjs', EXTENSION_COMBINATIONS[2])).toBe(
      'pjs-snowbridge',
    );
  });

  it('names the full SDK extension set', () => {
    expect(sdkExampleDir('pjs', EXTENSION_COMBINATIONS[7])).toBe(
      'pjs-evm-swap-snowbridge',
    );
  });
});
