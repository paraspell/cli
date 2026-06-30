#!/usr/bin/env node
import path from 'node:path';
import { getPackageRoot } from './package-root.js';
import { runEntry } from './shared/run-entry.js';
import { runCli } from './run-cli.js';

const packageRoot = getPackageRoot();
const templatesRoot = path.join(packageRoot, '_templates');

await runEntry(() => runCli(process.argv.slice(2), templatesRoot));
