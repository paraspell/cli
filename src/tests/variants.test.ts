import { describe, expect, it } from 'vitest';
import { EXTENSION_COMBINATIONS } from '../generate-examples.js';
import { FRAMEWORKS, SDK_CLIENTS } from '../shared/project-options.js';
import { listVariants } from './variants.js';

const SDK_PER_FRAMEWORK = SDK_CLIENTS.length * EXTENSION_COMBINATIONS.length;
const API_PER_FRAMEWORK = EXTENSION_COMBINATIONS.length;

describe('example matrix', () => {
  it('lists all SDK variants (framework × client × extension combination)', () => {
    const sdk = listVariants().filter((v) => v.kind === 'sdk');
    expect(sdk).toHaveLength(FRAMEWORKS.length * SDK_PER_FRAMEWORK);
  });

  it('lists all API variants (framework × extension combination)', () => {
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
