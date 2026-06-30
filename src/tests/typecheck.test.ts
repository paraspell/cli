import { describe, expect, it } from 'vitest';
import { typecheckVariant } from './run-typecheck.js';
import { filterVariants, variantTitle } from './test-env.js';

const TYPECHECK_TIMEOUT_MS = 5 * 60 * 1000;

describe('generated project typecheck', () => {
  const variants = filterVariants();

  it.each(variants)('$id', async (variant) => {
    const result = await typecheckVariant(variant, TYPECHECK_TIMEOUT_MS);
    const failed = result.steps.find((step) => !step.ok);
    expect(
      result.ok,
      failed ? `${failed.name} failed for ${variantTitle(variant)}:\n${failed.output}` : '',
    ).toBe(true);
  });
});
