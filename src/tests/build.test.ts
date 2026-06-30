import { describe, expect, it } from 'vitest';
import { buildVariant } from './run-build.js';
import { filterVariants, variantTitle } from './test-env.js';

const BUILD_TIMEOUT_MS = 5 * 60 * 1000;

describe('generated project build', () => {
  const variants = filterVariants();

  it.each(variants)('$id', async (variant) => {
    const result = await buildVariant(variant, BUILD_TIMEOUT_MS);
    const failed = result.steps.find((step) => !step.ok);
    expect(
      result.ok,
      failed ? `${failed.name} failed for ${variantTitle(variant)}:\n${failed.output}` : '',
    ).toBe(true);
  });
});
