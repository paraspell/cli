import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildApplication, buildCommand, run } from '@stricli/core';
import {
  frameworkPositional,
  packageManagerFlag,
} from './shared/cli-params.js';
import { generateApp } from './generator/generate.js';
import {
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_SDK_CLIENT,
  EXTENSION_KEYS,
  FRAMEWORKS,
  PROJECT_TYPES,
  SDK_CLIENTS,
  type TExtensions,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from './shared/project-options.js';

export const EXTENSION_COMBINATIONS: readonly TExtensions[] = [
  false,
  true,
].flatMap((evm) =>
  [false, true].flatMap((snowbridge) =>
    [false, true].map((swap) => ({ evm, swap, snowbridge })),
  ),
);

const extensionSuffix = (extensions: TExtensions): string => {
  return EXTENSION_KEYS.filter((key) => extensions[key]).join('-');
};

export const apiExampleName = (extensions: TExtensions): string => {
  return extensionSuffix(extensions) || 'base';
};

export const sdkExampleDir = (
  client: TSdkClient,
  extensions: TExtensions,
): string => {
  const suffix = extensionSuffix(extensions);
  return suffix ? `${client}-${suffix}` : client;
};

const cliRoot = fileURLToPath(new URL('../', import.meta.url));
const generateExamples = async (
  kind: TProjectType | undefined,
  framework: TFramework | undefined,
  packageManager: TPackageManager = DEFAULT_PACKAGE_MANAGER,
): Promise<void> => {
  const frameworks: readonly TFramework[] = framework
    ? [framework]
    : FRAMEWORKS;

  if (!kind || kind === 'sdk') {
    for (const fw of frameworks) {
      for (const client of SDK_CLIENTS) {
        for (const extensions of EXTENSION_COMBINATIONS) {
          const name = sdkExampleDir(client, extensions);
          await generateApp({
            kind: 'sdk',
            opts: {
              framework: fw,
              name,
              client,
              extensions,
              packageManager,
              out: path.join(cliRoot, 'generated', 'xcm-sdk', fw, name),
            },
          });
        }
      }
    }
  }

  if (!kind || kind === 'api') {
    for (const fw of frameworks) {
      for (const extensions of EXTENSION_COMBINATIONS) {
        const name = apiExampleName(extensions);
        await generateApp({
          kind: 'api',
          opts: {
            framework: fw,
            name: `xcm-api-${name}`,
            client: DEFAULT_SDK_CLIENT,
            out: path.join(cliRoot, 'generated', 'xcm-api', fw, name),
            extensions,
            packageManager,
          },
        });
      }
    }
  }
};

const command = buildCommand<
  { packageManager?: TPackageManager; kind?: TProjectType },
  [TFramework?]
>({
  docs: { brief: 'Generate ParaSpell XCM SDK and API example apps' },
  parameters: {
    positional: frameworkPositional,
    flags: {
      packageManager: packageManagerFlag,
      kind: {
        kind: 'enum',
        values: PROJECT_TYPES,
        brief: 'Which examples to generate (defaults to both)',
        optional: true,
      },
    },
  },
  func: async (flags, framework) => {
    try {
      await generateExamples(flags.kind, framework, flags.packageManager);
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  },
});

const app = buildApplication(command, {
  name: 'generate-examples',
  scanner: { caseStyle: 'allow-kebab-for-camel' },
});

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await run(app, process.argv.slice(2), { process });
}
