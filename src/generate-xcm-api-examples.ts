#!/usr/bin/env node
import path from 'node:path';
import { getPackageRoot } from './package-root.js';
import { API_EXAMPLES } from './examples/api-examples.js';
import { API_FRAMEWORKS } from './shared/frameworks.js';
import { generateApiApp } from './shared/hygen-runner.js';
import { shiftPositionalFramework } from './shared/parse-cli-args.js';
import { normalizePackageManager } from './shared/package-manager.js';
import { runEntry } from './shared/run-entry.js';
import type { Framework } from './shared/types.js';

const cliRoot = getPackageRoot();
const templatesRoot = path.join(cliRoot, '_templates');
const examplesRoot = path.join(cliRoot, 'generated/xcm-api');

const { argv, framework: positional } = shiftPositionalFramework(
  process.argv.slice(2),
);

const pmFlag =
  argv.find((a) => a.startsWith('--package-manager='))?.split('=')[1] ??
  (argv.includes('--package-manager')
    ? argv[argv.indexOf('--package-manager') + 1]
    : undefined);

const packageManager = normalizePackageManager(pmFlag);

const frameworks: Framework[] = positional
  ? [positional]
  : ['react', 'vue', 'node'];

await runEntry(async () => {
  for (const framework of frameworks) {
    const meta = API_FRAMEWORKS[framework];
    for (const variant of API_EXAMPLES) {
      await generateApiApp({
        meta,
        templatesRoot,
        opts: {
          framework,
          name: `xcm-api-${variant.name}`,
          out: path.join(examplesRoot, framework, variant.name),
          evm: variant.evm,
          swap: variant.swap,
          snowbridge: variant.snowbridge,
          packageManager,
        },
      });
    }
  }

  console.log(`Done. Examples at ${examplesRoot}`);
});
