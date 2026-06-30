import { describe, expect, it } from 'vitest';
import { collapseExtraBlankLines } from './normalize-blank-lines.js';

describe('collapseExtraBlankLines', () => {
  it('leaves single blank lines unchanged', () => {
    const input = 'a\n\nb';
    expect(collapseExtraBlankLines(input)).toBe(input);
  });

  it('collapses multiple consecutive blank lines to one', () => {
    expect(collapseExtraBlankLines('a\n\n\nb')).toBe('a\n\nb');
    expect(collapseExtraBlankLines('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('collapses blank lines that include whitespace-only lines', () => {
    expect(collapseExtraBlankLines('a\n\n  \nb')).toBe('a\n\nb');
  });

  it('handles CRLF line endings', () => {
    expect(collapseExtraBlankLines('a\r\n\r\n\r\nb')).toBe('a\r\n\r\nb');
  });

  it('collapses every run of extra blank lines in the file', () => {
    const input = 'first\n\n\nsecond\n\n\n\nthird';
    expect(collapseExtraBlankLines(input)).toBe('first\n\nsecond\n\nthird');
  });
});
