import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { installDependencies } from './install-dependencies.js';

const outputs: string[] = [];

const temporaryProject = (): string => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-install-'));
  fs.writeFileSync(
    path.join(output, 'package.json'),
    JSON.stringify({ private: true }),
  );
  outputs.push(output);
  return output;
};

afterEach(() => {
  for (const output of outputs.splice(0)) {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

describe('installDependencies', () => {
  it('installs an empty project', async () => {
    await expect(
      installDependencies(temporaryProject(), 'npm'),
    ).resolves.toMatchObject({ ok: true });
  });

  it('reports process startup errors', async () => {
    const missingDirectory = path.join(
      os.tmpdir(),
      'missing-paraspell-project',
    );

    await expect(
      installDependencies(missingDirectory, 'npm'),
    ).resolves.toMatchObject({ ok: false });
  });
});
