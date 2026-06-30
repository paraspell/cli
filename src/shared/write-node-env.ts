import fs from 'node:fs';
import path from 'node:path';
import type { Framework } from './types.js';

export function shouldWriteNodeEnv(framework: Framework): boolean {
  return framework === 'node';
}

function formatEnvValue(value: string): string {
  if (/[\s#"'\\]/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

export async function writeNodeEnv(
  outDir: string,
  options: {
    privateKey?: string;
    substrateMnemonic?: string;
    evmWallet?: boolean;
  } = {},
): Promise<void> {
  const substrateValue = options.substrateMnemonic ?? '';
  const lines = [`SUBSTRATE_MNEMONIC=${formatEnvValue(substrateValue)}`];
  if (options.evmWallet) {
    const evmValue = options.privateKey ?? '';
    lines.push(`PRIVATE_KEY=${formatEnvValue(evmValue)}`);
  }

  const envPath = path.join(outDir, '.env');
  // Always restrict to owner read/write: the file holds (or will soon hold)
  // wallet secrets, so it should never be created group/world-readable.
  await fs.promises.writeFile(envPath, `${lines.join('\n')}\n`, { mode: 0o600 });
}
