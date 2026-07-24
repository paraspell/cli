import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeNodeEnv } from './write-node-env.js';

const outputs: string[] = [];

const temporaryOutput = (): string => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-env-'));
  outputs.push(output);
  return output;
};

afterEach(() => {
  for (const output of outputs.splice(0)) {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

describe('writeNodeEnv', () => {
  it('writes only the Substrate setting by default', async () => {
    const out = temporaryOutput();

    await writeNodeEnv(out);

    expect(fs.readFileSync(path.join(out, '.env'), 'utf8')).toBe(
      'SUBSTRATE_MNEMONIC=\n',
    );
  });

  it('quotes and escapes sensitive values when needed', async () => {
    const out = temporaryOutput();

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
