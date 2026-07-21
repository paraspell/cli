import fs from 'node:fs';
import path from 'node:path';
import { intro, outro } from '@clack/prompts';
import terminalImage from 'terminal-image';
import { getPackageRoot } from './package-root.js';
import { applyFeatureFlags } from './shared/feature-flags.js';
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from './shared/feature-extensions-checkbox.js';
import { generateApp } from './shared/generate-dispatch.js';
import { printNextSteps } from './shared/next-steps.js';
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from './shared/prompt-secrets.js';
import {
  promptClient,
  promptFramework,
  promptName,
  promptPackageManager,
  promptProjectType,
} from './shared/prompts.js';
import type { SdkClient } from './shared/types.js';
import { validateNameInput } from './shared/validate.js';

const preferNativeTerminalImage = (): boolean => {
  const program = process.env.TERM_PROGRAM?.toLowerCase() ?? '';
  return program !== 'vscode' && program !== 'cursor';
};

const renderBanner = async (): Promise<void> => {
  try {
    const iconPath = path.join(
      getPackageRoot(),
      'assets',
      'paraspell-icon.png',
    );
    const buffer = await fs.promises.readFile(iconPath);
    const image = await terminalImage.buffer(buffer, {
      width: '40%',
      height: '40%',
      preferNativeRender: preferNativeTerminalImage(),
    });
    console.log(image);
  } catch {
    // Decorative banner unavailable; continue without it.
  }
};

export const runInteractiveGenerate = async (
  templatesRoot: string,
): Promise<void> => {
  await renderBanner();
  intro('Welcome to the Paraspell CLI');

  const projectName = await promptName('my-app', (name) => {
    const base = validateNameInput(name);
    if (base !== true) return base;
    const target = path.join(process.cwd(), name.trim());
    if (fs.existsSync(target)) return `Project already exists: ${target}`;
    return true;
  });

  const projectPath = path.join(process.cwd(), projectName);

  const packageManager = await promptPackageManager('pnpm');
  const framework = await promptFramework();
  const projectType = await promptProjectType();

  let client: SdkClient = 'pjs';
  if (projectType === 'sdk') {
    client = await promptClient('pjs');
  }

  const additionalFeatures = await promptFeatureExtensions();

  const featureFlags = applyFeatureFlags({
    evm: additionalFeatures.includes(EVM_EXTENSION),
    swap: additionalFeatures.includes(SWAP_EXTENSION),
    snowbridge: additionalFeatures.includes(SNOWBRIDGE_EXTENSION),
  });

  const substrateMnemonic =
    framework === 'node' ? await promptSubstrateMnemonic() : undefined;

  const privateKey =
    framework === 'node' && featureFlags.evmWallet
      ? await promptEvmPrivateKey()
      : undefined;

  const opts = {
    framework,
    name: projectName,
    ...featureFlags,
    packageManager,
    out: projectPath,
    privateKey,
    substrateMnemonic,
  };

  await generateApp(
    projectType === 'sdk'
      ? { kind: projectType, framework, templatesRoot, opts: { ...opts, client } }
      : { kind: projectType, framework, templatesRoot, opts },
  );

  outro(`Scaffolded ${projectName}`);
  printNextSteps(projectName, packageManager, framework);
};
