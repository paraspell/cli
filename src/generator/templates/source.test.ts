import { describe, expect, it } from 'vitest';
import { source } from './source.js';

const render = (value: ReturnType<typeof source>): string => value.trim();

describe('source', () => {
  it('removes the actual template indentation instead of assuming a width', () => {
    expect(
      render(source`
        first
          nested
        last
      `),
    ).toBe('first\n  nested\nlast');

    expect(
      render(source`
          first
            nested
          last
      `),
    ).toBe('first\n  nested\nlast');
  });
});
