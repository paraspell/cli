import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeNodeEnv } from './write-node-env.js';

const temporaryOutput = () =>
  fs.mkdtempDisposableSync(path.join(os.tmpdir(), 'paraspell-env-'));

describe('writeNodeEnv', () => {
  it('writes only the Substrate setting by default', async () => {
    using output = temporaryOutput();
    const out = output.path;

    await writeNodeEnv(out);

    expect(fs.readFileSync(path.join(out, '.env'), 'utf8')).toBe(
      'SUBSTRATE_MNEMONIC=\n',
    );
  });

  it('quotes and escapes sensitive values when needed', async () => {
    using output = temporaryOutput();
    const out = output.path;

    await writeNodeEnv(out, {
      evmWallet: true,
      substrateMnemonic: 'two words',
      privateKey: 'key"with\\characters',
    });

    expect(fs.readFileSync(path.join(out, '.env'), 'utf8')).toBe(
      'SUBSTRATE_MNEMONIC="two words"\nPRIVATE_KEY="key\\"with\\\\characters"\n',
    );
  });
});
