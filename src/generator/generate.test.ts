import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateApp } from './generate.js';

const temporaryOutput = () =>
  fs.mkdtempDisposableSync(path.join(os.tmpdir(), 'paraspell-generator-'));

describe('generateApp', () => {
  it('ships compact ParaSpell web assets at their intended dimensions', () => {
    const readPng = (name: string) => {
      const png = fs.readFileSync(path.resolve('assets', name));
      return {
        bytes: png.byteLength,
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20),
      };
    };

    const wordmark = readPng('paraspell.png');
    expect(wordmark.width).toBe(450);
    expect(wordmark.height).toBe(128);
    expect(wordmark.bytes).toBeLessThan(50 * 1024);

    const icon = readPng('paraspell-icon.png');
    expect(icon.width).toBe(128);
    expect(icon.height).toBe(128);
    expect(icon.bytes).toBeLessThan(20 * 1024);
  });

  it('replaces an existing directory with a browser project and its logo', async () => {
    using output = temporaryOutput();
    const out = output.path;
    fs.writeFileSync(path.join(out, 'stale.txt'), 'stale');

    await generateApp({
      kind: 'sdk',
      opts: {
        framework: 'react',
        name: 'browser-app',
        client: 'dedot',
        packageManager: 'npm',
        out,
        extensions: { evm: false, swap: false, snowbridge: false },
      },
    });

    expect(fs.existsSync(path.join(out, 'stale.txt'))).toBe(false);
    expect(fs.existsSync(path.join(out, 'public', 'paraspell.png'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'public', 'paraspell-icon.png'))).toBe(
      true,
    );
    expect(fs.readFileSync(path.join(out, 'package.json'), 'utf8')).toContain(
      '"name": "browser-app"',
    );
  });

  it('writes a private node environment with configured wallets', async () => {
    using output = temporaryOutput();
    const out = output.path;
    const privateKey = `0x${'a'.repeat(64)}`;

    await generateApp({
      kind: 'api',
      opts: {
        framework: 'node',
        name: 'node-api',
        client: 'papi',
        packageManager: 'pnpm',
        out,
        privateKey,
        substrateMnemonic: '//Alice',
        extensions: { evm: true, swap: true, snowbridge: true },
      },
    });

    expect(fs.readFileSync(path.join(out, '.env'), 'utf8')).toBe(
      `SUBSTRATE_MNEMONIC=//Alice\nPRIVATE_KEY=${privateKey}\n`,
    );
    expect(fs.statSync(path.join(out, '.env')).mode & 0o777).toBe(0o600);
    expect(fs.existsSync(path.join(out, 'pnpm-workspace.yaml'))).toBe(true);
  });
});
