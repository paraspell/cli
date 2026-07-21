import { describe, expect, it } from 'vitest';
import { assertVariantStructure } from './assert-structure.js';
import { listVariants } from './variants.js';

describe('generated project structure', () => {
  const variants = listVariants();

  it.each(variants)('$id', async (variant) => {
    const result = await assertVariantStructure(variant);
    expect(result.errors, variant.id).toEqual([]);
  });
});
