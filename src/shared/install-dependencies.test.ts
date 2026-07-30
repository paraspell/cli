import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { installDependencies } from './install-dependencies.js';

const temporaryProject = () => {
  const output = fs.mkdtempDisposableSync(
    path.join(os.tmpdir(), 'paraspell-install-'),
  );
  fs.writeFileSync(
    path.join(output.path, 'package.json'),
    JSON.stringify({ private: true }),
  );
  return output;
};

describe('installDependencies', () => {
  it('installs an empty project', async () => {
    using project = temporaryProject();

    await expect(
      installDependencies(project.path, 'npm'),
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
