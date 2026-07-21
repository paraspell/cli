import { describe, expect, it } from 'vitest';
import { FEATURE_COMBOS } from '../generate-examples.js';
import { FRAMEWORKS, SDK_CLIENTS } from '../shared/types.js';
import { listVariants } from './variants.js';

const SDK_PER_FRAMEWORK = SDK_CLIENTS.length * FEATURE_COMBOS.length;
const API_PER_FRAMEWORK = FEATURE_COMBOS.length;

describe('example matrix', () => {
  it('lists all SDK variants (framework × client × feature combo)', () => {
    const sdk = listVariants().filter((v) => v.kind === 'sdk');
    expect(sdk).toHaveLength(FRAMEWORKS.length * SDK_PER_FRAMEWORK);
  });

  it('lists all API variants (framework × feature combo)', () => {
    const api = listVariants().filter((v) => v.kind === 'api');
    expect(api).toHaveLength(FRAMEWORKS.length * API_PER_FRAMEWORK);
  });

  it('uses unique variant ids', () => {
    const ids = listVariants().map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(
      FRAMEWORKS.length * (SDK_PER_FRAMEWORK + API_PER_FRAMEWORK),
    );
  });
});
