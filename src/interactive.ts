import fs from "node:fs";
import path from "node:path";
import { intro, outro } from "@clack/prompts";
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from "./shared/feature-extensions-checkbox.js";
import { generateApp } from "./generator/generate.js";
import { printNextSteps } from "./shared/next-steps.js";
import {
  promptEvmPrivateKey,
  promptSubstrateMnemonic,
} from "./shared/prompt-secrets.js";
import {
  promptClient,
  promptFramework,
  promptName,
  promptPackageManager,
  promptProjectType,
} from "./shared/prompts.js";
import type { SdkClient } from "./shared/types.js";
import { validateNameInput } from "./shared/validate.js";

export const runInteractiveGenerate = async (): Promise<void> => {
  intro("Welcome to ParaSpell✨ CLI");

  const projectName = await promptName("my-app", (name) => {
    const base = validateNameInput(name);
    if (base !== true) return base;
    const target = path.join(process.cwd(), name.trim());
    if (fs.existsSync(target)) return `Project already exists: ${target}`;
    return true;
  });

  const projectPath = path.join(process.cwd(), projectName);

  const packageManager = await promptPackageManager("pnpm");
  const framework = await promptFramework();
  const projectType = await promptProjectType();

  let client: SdkClient = "pjs";
  if (projectType === "sdk") {
    client = await promptClient("pjs");
  }

  const additionalFeatures = await promptFeatureExtensions();

  const featureFlags = {
    evm: additionalFeatures.includes(EVM_EXTENSION),
    swap: additionalFeatures.includes(SWAP_EXTENSION),
    snowbridge: additionalFeatures.includes(SNOWBRIDGE_EXTENSION),
  };

  const substrateMnemonic =
    framework === "node" ? await promptSubstrateMnemonic() : undefined;

  const privateKey =
    framework === "node" && (featureFlags.evm || featureFlags.snowbridge)
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
    projectType === "sdk"
      ? { kind: projectType, opts: { ...opts, client } }
      : { kind: projectType, opts },
  );

  outro(`Scaffolded ${projectName}`);
  printNextSteps(projectName, packageManager, framework);
};
