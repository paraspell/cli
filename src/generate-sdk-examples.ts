#!/usr/bin/env node
import path from 'node:path';
import { getPackageRoot } from './package-root.js';
import { SDK_EXAMPLES } from './examples/sdk-examples.js';
import { SDK_FRAMEWORKS } from './shared/frameworks.js';
import { generateSdkApp } from './shared/hygen-runner.js';
import { shiftPositionalFramework } from './shared/parse-cli-args.js';
import { normalizePackageManager } from './shared/package-manager.js';
import { runEntry } from './shared/run-entry.js';
import type { Framework } from './shared/types.js';

const cliRoot = getPackageRoot();
const templatesRoot = path.join(cliRoot, '_templates');

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
    console.log(`Generated ${SDK_EXAMPLES[framework].length} ${meta.label} examples`);
  }
});
