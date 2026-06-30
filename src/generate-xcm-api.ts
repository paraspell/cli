#!/usr/bin/env node
import path from 'node:path';
import { getPackageRoot } from './package-root.js';
import { runEntry } from './shared/run-entry.js';
import { runApiFromArgv } from './run-cli.js';

const cliRoot = getPackageRoot();
const templatesRoot = path.join(cliRoot, '_templates');

await runEntry(() =>
  runApiFromArgv(process.argv.slice(2), {
    root: cliRoot,
    templatesRoot,
  }),
);
