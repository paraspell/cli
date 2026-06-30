import { describe, expect, it } from 'vitest';
import { API_EXAMPLES, API_VARIANTS_PER_FRAMEWORK } from '../examples/api-examples.js';
import { SDK_EXAMPLES, SDK_VARIANTS_PER_FRAMEWORK } from '../examples/sdk-examples.js';
import { FEATURE_COMBOS, SDK_CLIENTS } from '../examples/feature-combos.js';
import type { Framework } from '../shared/types.js';
import { listVariants } from './variants.js';

const FRAMEWORKS: Framework[] = ['react', 'vue', 'node'];

describe('example matrix', () => {
  it('lists all SDK variants (framework × client × feature combo)', () => {
    expect(listVariants({ kind: 'sdk' })).toHaveLength(
      FRAMEWORKS.length * SDK_VARIANTS_PER_FRAMEWORK,
    );
    expect(SDK_VARIANTS_PER_FRAMEWORK).toBe(SDK_CLIENTS.length * FEATURE_COMBOS.length);
  });

  it('lists all API variants (framework × feature combo)', () => {
    expect(listVariants({ kind: 'api' })).toHaveLength(
      FRAMEWORKS.length * API_VARIANTS_PER_FRAMEWORK,
    );
    expect(API_VARIANTS_PER_FRAMEWORK).toBe(FEATURE_COMBOS.length);
  });

  it('matches sdk-examples.ts per framework', () => {
    for (const framework of Object.keys(SDK_EXAMPLES) as Framework[]) {
      expect(listVariants({ kind: 'sdk', framework })).toHaveLength(
        SDK_EXAMPLES[framework].length,
      );
      expect(SDK_EXAMPLES[framework]).toHaveLength(SDK_VARIANTS_PER_FRAMEWORK);
    }
  });

  it('matches api-examples.ts per framework', () => {
    for (const framework of FRAMEWORKS) {
      expect(listVariants({ kind: 'api', framework })).toHaveLength(
        API_EXAMPLES.length,
      );
      expect(API_EXAMPLES).toHaveLength(API_VARIANTS_PER_FRAMEWORK);
    }
  });

  it('uses unique variant ids', () => {
    const ids = listVariants().map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(
      FRAMEWORKS.length * (SDK_VARIANTS_PER_FRAMEWORK + API_VARIANTS_PER_FRAMEWORK),
    );
  });
});
