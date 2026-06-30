import fs from 'node:fs';
import path from 'node:path';
import { input, select, Separator } from '@inquirer/prompts';
import terminalImage from 'terminal-image';
import { getPackageRoot } from './package-root.js';
import { applyFeatureFlags } from './shared/feature-flags.js';
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from './shared/feature-extensions-checkbox.js';
import { API_FRAMEWORKS, SDK_FRAMEWORKS } from './shared/frameworks.js';
import { generateApiApp, generateSdkApp } from './shared/hygen-runner.js';
import { printNextSteps } from './shared/next-steps.js';
import { PACKAGE_MANAGERS } from './shared/package-manager.js';
import { promptEvmPrivateKey } from './shared/prompt-evm-private-key.js';
import { promptSubstrateMnemonic } from './shared/prompt-substrate-mnemonic.js';
import type {
  Framework,
  PackageManager,
  ProjectType,
  SdkClient,
} from './shared/types.js';
import { validateNameInput } from './shared/validate.js';

function preferNativeTerminalImage(): boolean {
  const program = process.env.TERM_PROGRAM?.toLowerCase() ?? '';
  return program !== 'vscode' && program !== 'cursor';
}

async function renderBanner(): Promise<void> {
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
}

export async function runInteractiveGenerate(
  templatesRoot: string,
): Promise<void> {
  await renderBanner();
  console.log('Welcome to the Paraspell CLI\n');

  const projectName = await input({
    message: 'Enter the project name',
    default: 'my-app',
    validate: (name) => {
      const base = validateNameInput(name);
      if (base !== true) return base;
      const target = path.join(process.cwd(), name.trim());
      if (fs.existsSync(target)) return `Project already exists: ${target}`;
      return true;
    },
  });

  const projectPath = path.join(process.cwd(), projectName);

  const packageManager = await select<PackageManager>({
    message: 'Select the desired package manager',
    choices: [
      new Separator(),
      ...PACKAGE_MANAGERS.map((pm) => ({ name: pm, value: pm })),
    ],
  });

  const framework = await select<Framework>({
    message: 'Select the desired framework',
    choices: [
      new Separator(),
      { name: 'Vite - React', value: 'react' },
      { name: 'Vite - Vue', value: 'vue' },
      { name: 'NodeJS', value: 'node' },
    ],
  });

  const projectType = await select<ProjectType>({
    message: 'Select the desired project type',
    choices: [
      new Separator(),
      { name: 'XCM SDK', value: 'sdk' },
      { name: 'XCM API', value: 'api' },
    ],
  });

  let client: SdkClient = 'pjs';
  if (projectType === 'sdk') {
    client = await select<SdkClient>({
      message: 'Select the desired JS client type',
      choices: [
        new Separator(),
        { name: 'Polkadot API', value: 'papi' },
        { name: 'Polkadot JS', value: 'pjs' },
        { name: 'Dedot', value: 'dedot' },
      ],
    });
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

  if (projectType === 'sdk') {
    await generateSdkApp({
      meta: SDK_FRAMEWORKS[framework],
      templatesRoot,
      opts: {
        framework,
        name: projectName,
        client,
        ...featureFlags,
        packageManager,
        out: projectPath,
        privateKey,
        substrateMnemonic,
      },
    });
  } else {
    await generateApiApp({
      meta: API_FRAMEWORKS[framework],
      templatesRoot,
      opts: {
        framework,
        name: projectName,
        ...featureFlags,
        packageManager,
        out: projectPath,
        privateKey,
        substrateMnemonic,
      },
    });
  }

  printNextSteps(projectName, packageManager, framework);
}
