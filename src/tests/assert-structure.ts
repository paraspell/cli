import fs from 'node:fs';
import path from 'node:path';
import { hasExtraBlankLines } from '../shared/normalize-blank-lines.js';
import type { GeneratedVariant } from './variants.js';

export interface StructureResult {
  variant: GeneratedVariant;
  ok: boolean;
  errors: string[];
}

function fileExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

async function walkSourceFiles(
  dir: string,
  files: string[] = [],
): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isDirectory()) {
      await walkSourceFiles(full, files);
    } else if (/\.(ts|tsx|vue|js|jsx|json|html|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function assertNoExtraBlankLines(root: string): Promise<string[]> {
  const errors: string[] = [];
  const files = await walkSourceFiles(root);
  for (const file of files) {
    const content = await fs.promises.readFile(file, 'utf8');
    if (hasExtraBlankLines(content)) {
      errors.push(
        `Multiple consecutive blank lines in ${path.relative(root, file)}`,
      );
    }
  }
  return errors;
}

async function assertNoTemplateArtifacts(root: string): Promise<string[]> {
  const errors: string[] = [];
  const files = await walkSourceFiles(root);
  for (const file of files) {
    if (file.endsWith('.ejs.t')) {
      errors.push(`Template artifact: ${path.relative(root, file)}`);
      continue;
    }
    const content = await fs.promises.readFile(file, 'utf8');
    if (content.includes('<%') || content.includes('<%=')) {
      errors.push(`Unrendered EJS in ${path.relative(root, file)}`);
    }
  }
  return errors;
}

function assertPackageDeps(
  pkg: Record<string, Record<string, string> | undefined>,
  variant: GeneratedVariant,
): string[] {
  const errors: string[] = [];
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (variant.kind === 'sdk') {
    if (variant.client === 'pjs' && !deps['@paraspell/sdk-pjs']) {
      errors.push('Missing dependency @paraspell/sdk-pjs');
    }
    if (variant.client === 'papi' && !deps['@paraspell/sdk']) {
      errors.push('Missing dependency @paraspell/sdk');
    }
    if (variant.client === 'dedot' && !deps['@paraspell/sdk-dedot']) {
      errors.push('Missing dependency @paraspell/sdk-dedot');
    }
    if (variant.client !== 'papi' && deps['@paraspell/sdk']) {
      errors.push('Unexpected dependency @paraspell/sdk when client is not papi');
    }
    if (variant.swap && !deps['@paraspell/swap']) {
      errors.push('Missing dependency @paraspell/swap');
    }
  }

  if (variant.framework === 'node' && !deps['dotenv']) {
    errors.push('Missing dependency dotenv');
  }
  if (variant.framework === 'node' && !deps['express']) {
    errors.push('Missing dependency express');
  }
  if (variant.framework === 'node' && variant.kind === 'sdk') {
    if (!deps['@polkadot/keyring']) {
      errors.push('Missing dependency @polkadot/keyring');
    }
    if (!deps['@polkadot/util-crypto']) {
      errors.push('Missing dependency @polkadot/util-crypto');
    }
  }

  const evmWallet = variant.evm || variant.snowbridge;

  if (variant.evm) {
    if (variant.kind === 'sdk') {
      if (!deps['@paraspell/evm']) errors.push('Missing dependency @paraspell/evm');
    }
  } else if (deps['@paraspell/evm']) {
    errors.push('Unexpected dependency @paraspell/evm when evm=false');
  }

  if (evmWallet) {
    if (!deps['viem']) errors.push('Missing dependency viem');
    if (variant.framework !== 'node' && !deps['mipd']) {
      errors.push('Missing dependency mipd');
    }
  } else if (deps['viem']) {
    errors.push('Unexpected dependency viem when evm and snowbridge are false');
  }

  if (variant.framework !== 'node' && deps['dotenv']) {
    errors.push('Unexpected dependency dotenv for non-node framework');
  }

  if (variant.snowbridge) {
    if (variant.kind === 'sdk' && !deps['@paraspell/evm-snowbridge']) {
      errors.push('Missing dependency @paraspell/evm-snowbridge');
    }
  } else if (deps['@paraspell/evm-snowbridge']) {
    errors.push('Unexpected dependency @paraspell/evm-snowbridge when snowbridge=false');
  }

  if (variant.kind === 'api') {
    if (!deps['axios']) errors.push('Missing dependency axios');
    if (deps['@paraspell/sdk']) {
      errors.push('Unexpected dependency @paraspell/sdk in api project');
    }
    if (deps['@paraspell/evm']) {
      errors.push('Unexpected dependency @paraspell/evm in api project');
    }
    if (deps['@paraspell/evm-snowbridge']) {
      errors.push('Unexpected dependency @paraspell/evm-snowbridge in api project');
    }
  }

  return errors;
}

function assertConditionalFiles(variant: GeneratedVariant, root: string): string[] {
  const errors: string[] = [];
  const isWeb = variant.framework === 'react' || variant.framework === 'vue';
  const evmWallet = variant.evm || variant.snowbridge;

  if (!fileExists(root, 'package.json')) {
    errors.push('Missing package.json');
    return errors;
  }

  if (variant.framework === 'node') {
    if (!fileExists(root, 'src/index.ts')) {
      errors.push('Missing src/index.ts');
    }
    if (!fileExists(root, 'src/transfer.ts')) {
      errors.push('Missing src/transfer.ts');
    }
    if (!fileExists(root, 'src/substrate.ts')) {
      errors.push('Missing src/substrate.ts');
    }
    if (evmWallet !== fileExists(root, 'src/evm.ts')) {
      errors.push(
        evmWallet ? 'Missing src/evm.ts' : 'Unexpected src/evm.ts when wallet origins are disabled',
      );
    }
    if (variant.kind === 'api' && evmWallet !== fileExists(root, 'src/evmOrigins.ts')) {
      errors.push(
        evmWallet ? 'Missing src/evmOrigins.ts' : 'Unexpected src/evmOrigins.ts when wallet origins are disabled',
      );
    }
    if (variant.kind === 'sdk' && !fileExists(root, 'src/isEvmOrigin.ts')) {
      errors.push('Missing src/isEvmOrigin.ts');
    }
    if (evmWallet !== fileExists(root, 'src/getViemChain.ts')) {
      errors.push(
        evmWallet ? 'Missing src/getViemChain.ts' : 'Unexpected src/getViemChain.ts when wallet origins are disabled',
      );
    }
    return errors;
  }

  if (isWeb) {
    if (!fileExists(root, 'vite.config.ts')) {
      errors.push('Missing vite.config.ts');
    }
    if (!fileExists(root, 'index.html')) {
      errors.push('Missing index.html');
    }

    const entry =
      variant.framework === 'react' ? 'src/main.tsx' : 'src/main.ts';
    if (!fileExists(root, entry)) {
      errors.push(`Missing ${entry}`);
    }

    if (variant.kind === 'sdk' && variant.client) {
      for (const client of ['papi', 'pjs', 'dedot']) {
        const rel = `src/xcm/${client}.ts`;
        const shouldExist = variant.client === client;
        if (shouldExist !== fileExists(root, rel)) {
          errors.push(
            shouldExist ? `Missing ${rel}` : `Unexpected ${rel} for client=${variant.client}`,
          );
        }
      }
      if (!fileExists(root, 'src/evm/isEvmOrigin.ts')) {
        errors.push('Missing src/evm/isEvmOrigin.ts');
      }
    }

    if (evmWallet) {
      if (!fileExists(root, 'src/evm/index.ts')) {
        errors.push('Missing src/evm/index.ts');
      }
      for (const rel of [
        'src/evm/eip6963.ts',
        'src/evm/getViemChain.ts',
        'src/evm/utils.ts',
        'src/requireAsset.ts',
      ]) {
        if (!fileExists(root, rel)) {
          errors.push(`Missing ${rel}`);
        }
      }
      if (variant.kind === 'api' && !fileExists(root, 'src/evm/evmOrigins.ts')) {
        errors.push('Missing src/evm/evmOrigins.ts');
      }
      if (
        variant.kind === 'api' &&
        !fileExists(root, 'src/evm/useEvmOriginChains.ts')
      ) {
        errors.push('Missing src/evm/useEvmOriginChains.ts');
      }
      if (variant.kind === 'sdk' && !fileExists(root, 'src/xcm/evmTransfer.ts')) {
        errors.push('Missing src/xcm/evmTransfer.ts');
      }
      if (variant.kind === 'api' && fileExists(root, 'src/xcm/evmTransfer.ts')) {
        errors.push('Unexpected src/xcm/evmTransfer.ts in api project');
      }
    } else {
      for (const rel of ['src/evm/index.ts', 'src/xcm/evmTransfer.ts']) {
        if (fileExists(root, rel)) {
          errors.push(`Unexpected ${rel} when wallet origins are disabled`);
        }
      }
    }

    if (variant.kind === 'api') {
      const swapFiles = [
        'src/swap/exchangeChains.ts',
        'src/swap/index.ts',
        'src/swap/useExchangeChains.ts',
      ];
      for (const rel of swapFiles) {
        if (variant.swap !== fileExists(root, rel)) {
          errors.push(
            variant.swap
              ? `Missing ${rel}`
              : `Unexpected ${rel} when swap is disabled`,
          );
        }
      }
    }
  }

  return errors;
}

async function assertNodeEnv(variant: GeneratedVariant, root: string): Promise<string[]> {
  const errors: string[] = [];
  if (variant.framework !== 'node') return errors;

  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) {
    errors.push('Missing .env');
    return errors;
  }

  const content = await fs.promises.readFile(envPath, 'utf8');
  if (!content.includes('SUBSTRATE_MNEMONIC=')) {
    errors.push('.env must include SUBSTRATE_MNEMONIC=');
  }
  const evmWallet = variant.evm || variant.snowbridge;
  const envLines = content.split('\n').filter((line) => line.length > 0);
  const hasEvmPrivateKey = envLines.some((line) => line.startsWith('PRIVATE_KEY='));
  if (evmWallet && !hasEvmPrivateKey) {
    errors.push('.env must include PRIVATE_KEY= when EVM or Snowbridge wallet origins are enabled');
  }
  if (!evmWallet && hasEvmPrivateKey) {
    errors.push('Unexpected PRIVATE_KEY= in .env when wallet origins are disabled');
  }

  const indexPath = path.join(root, 'src/index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = await fs.promises.readFile(indexPath, 'utf8');
    if (!indexContent.includes('dotenv/config')) {
      errors.push('src/index.ts must import dotenv/config');
    }
  }

  return errors;
}

export async function assertVariantStructure(
  variant: GeneratedVariant,
): Promise<StructureResult> {
  const errors: string[] = [];
  const root = variant.absPath;

  if (!fs.existsSync(root)) {
    return { variant, ok: false, errors: [`Directory does not exist: ${root}`] };
  }

  errors.push(...assertConditionalFiles(variant, root));

  try {
    const raw = await fs.promises.readFile(path.join(root, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as Record<string, Record<string, string> | undefined>;
    errors.push(...assertPackageDeps(pkg, variant));

    const scripts = pkg.scripts as Record<string, string> | undefined;
    if (!scripts?.typecheck) errors.push('Missing script: typecheck');
    if (variant.framework === 'node') {
      if (!scripts?.build) errors.push('Missing script: build');
    } else {
      if (!scripts?.build) errors.push('Missing script: build');
      if (!scripts?.lint) errors.push('Missing script: lint');
    }
  } catch {
    if (!errors.some((e) => e.includes('package.json'))) {
      errors.push('Invalid or unreadable package.json');
    }
  }

  errors.push(...(await assertNoTemplateArtifacts(root)));
  errors.push(...(await assertNoExtraBlankLines(root)));
  errors.push(...(await assertNodeEnv(variant, root)));

  return { variant, ok: errors.length === 0, errors };
}
