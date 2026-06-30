import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_EXAMPLES } from '../examples/api-examples.js';
import { SDK_EXAMPLES } from '../examples/sdk-examples.js';
import { API_FRAMEWORKS, SDK_FRAMEWORKS } from '../shared/frameworks.js';
import { generateApiApp, generateSdkApp } from '../shared/hygen-runner.js';
import { normalizePackageManager } from '../shared/package-manager.js';
import type { Framework } from '../shared/types.js';
import type { VariantKind } from './variants.js';

const cliRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const templatesRoot = path.join(cliRoot, '_templates');

export async function generateAllExamples(options?: {
  kind?: VariantKind;
  framework?: Framework;
  packageManager?: string;
}): Promise<void> {
  const packageManager = normalizePackageManager(options?.packageManager);
  const frameworks: Framework[] = options?.framework
    ? [options.framework]
    : ['react', 'vue', 'node'];

  if (!options?.kind || options.kind === 'sdk') {
    for (const framework of frameworks) {
      const meta = SDK_FRAMEWORKS[framework];
      for (const ex of SDK_EXAMPLES[framework]) {
        await generateSdkApp({
          meta,
          templatesRoot,
          opts: {
            framework,
            name: ex.dir,
            client: ex.client,
            evm: ex.evm,
            swap: ex.swap,
            snowbridge: ex.snowbridge,
            packageManager,
            out: path.join(cliRoot, 'generated', 'xcm-sdk', framework, ex.dir),
          },
        });
      }
    }
  }

  if (!options?.kind || options.kind === 'api') {
    for (const framework of frameworks) {
      const meta = API_FRAMEWORKS[framework];
      for (const variant of API_EXAMPLES) {
        await generateApiApp({
          meta,
          templatesRoot,
          opts: {
            framework,
            name: `xcm-api-${variant.name}`,
            out: path.join(cliRoot, 'generated', 'xcm-api', framework, variant.name),
            evm: variant.evm,
            swap: variant.swap,
            snowbridge: variant.snowbridge,
            packageManager,
          },
        });
      }
    }
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const frameworkPos = argv.find((a) => ['react', 'vue', 'node'].includes(a));
  const framework = frameworkPos as Framework | undefined;
  const kindFlag = argv.find((a) => a.startsWith('--kind='))?.split('=')[1];
  const kind =
    kindFlag === 'sdk' || kindFlag === 'api'
      ? kindFlag
      : argv.includes('--kind')
        ? (argv[argv.indexOf('--kind') + 1] as VariantKind | undefined)
        : undefined;
  const pmFlag = argv.find((a) => a.startsWith('--package-manager='))?.split('=')[1];
  const packageManager = pmFlag ??
    (argv.includes('--package-manager')
      ? argv[argv.indexOf('--package-manager') + 1]
      : undefined);

  await generateAllExamples({ kind, framework, packageManager });
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
