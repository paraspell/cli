import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateProjectTarget } from './utils.js';

const outputs: string[] = [];

const temporaryRoot = (): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-utils-'));
  outputs.push(root);
  return root;
};

afterEach(() => {
  for (const output of outputs.splice(0)) {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

describe('project target utilities', () => {
  it('validates the project name and target availability together', () => {
    const root = temporaryRoot();
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
