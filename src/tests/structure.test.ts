import { describe, expect, it } from 'vitest';
import { assertVariantStructure } from './assert-structure.js';
import { filterVariants, variantTitle } from './test-env.js';

describe('generated project structure', () => {
  const variants = filterVariants();

  it.each(variants)('$id', async (variant) => {
    const result = await assertVariantStructure(variant);
    expect(result.errors, variantTitle(variant)).toEqual([]);
  });
});
