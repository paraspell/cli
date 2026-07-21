import { describe, expect, it } from 'vitest';
import { typecheckVariant } from './run-typecheck.js';
import { listVariants } from './variants.js';

const TYPECHECK_TIMEOUT_MS = 5 * 60 * 1000;

describe('generated project typecheck', () => {
  const variants = listVariants();

  it.each(variants)('$id', async (variant) => {
    const result = await typecheckVariant(variant, TYPECHECK_TIMEOUT_MS);
    const failed = result.steps.find((step) => !step.ok);
    expect(
      result.ok,
      failed ? `${failed.name} failed for ${variant.id}:\n${failed.output}` : '',
    ).toBe(true);
  });
});
