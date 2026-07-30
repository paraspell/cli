import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateProjectTarget } from './utils.js';

const temporaryRoot = () =>
  fs.mkdtempDisposableSync(path.join(os.tmpdir(), 'paraspell-utils-'));

describe('project target utilities', () => {
  it('validates the project name and target availability together', () => {
    using temporary = temporaryRoot();
    const root = temporary.path;
    const available = path.join(root, 'available');
    const taken = path.join(root, 'taken');
    fs.mkdirSync(taken);

    expect(validateProjectTarget('Invalid Name', available)).toMatch(
      /^Invalid project name:/,
    );
    expect(validateProjectTarget('available', available)).toBe(true);
    expect(validateProjectTarget('taken', taken)).toBe(
      `Project already exists: ${taken}`,
    );
  });
});
