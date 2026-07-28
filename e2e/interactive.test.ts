import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  compareProjects,
  createFakePackageManager,
  createTemporaryRoot,
  generateProject,
  removeTemporaryRoot,
  runInteractiveCli,
} from './helpers.js';
import type { TGenerationCase } from './matrix.js';

const privateKey = `0x${'a'.repeat(64)}`;

let root: string;
let interactiveRoot: string;

const expectInstall = (marker: string, project: string): void => {
  expect(JSON.parse(fs.readFileSync(marker, 'utf8'))).toEqual({
    args: ['install'],
    cwd: fs.realpathSync(project),
  });
};

beforeEach(() => {
  root = createTemporaryRoot('interactive');
  interactiveRoot = path.join(root, 'interactive');
  fs.mkdirSync(interactiveRoot);
});

afterEach(() => {
  removeTemporaryRoot(root);
});

describe('interactive wizard', () => {
  it('matches CLI generation for an SDK browser project', async () => {
    const expected = path.join(root, 'expected');
    const install = createFakePackageManager(root, 'npm');
    const testCase: TGenerationCase = {
      kind: 'sdk',
      framework: 'vue',
      client: 'dedot',
      extensions: { evm: true, swap: false, snowbridge: true },
      packageManager: 'npm',
    };

    await runInteractiveCli(
      interactiveRoot,
      [
        { prompt: 'What would you like to build?', keys: '\r' },
        { prompt: 'Choose a framework', keys: '\u001B[B\r' },
        { prompt: 'Choose a Polkadot client', keys: '\u001B[B\u001B[B\r' },
        {
          prompt: 'Choose extensions',
          keys: ' \u001B[B\u001B[B \r',
        },
        { prompt: 'Name your project', keys: '\u0015interactive-sdk\r' },
        { prompt: 'Choose a package manager', keys: '\u001B[A\u001B[A\r' },
        { prompt: 'Continue with this configuration?', keys: '\r' },
      ],
      install.env,
    );

    await generateProject(testCase, expected, 'interactive-sdk');
    const actual = path.join(interactiveRoot, 'interactive-sdk');
    compareProjects(actual, expected);
    expectInstall(install.marker, actual);
  });

  it('matches CLI generation for a Node API with wallet secrets', async () => {
    const expected = path.join(root, 'expected');
    const install = createFakePackageManager(root, 'pnpm');
    const testCase: TGenerationCase = {
      kind: 'api',
      framework: 'node',
      extensions: { evm: true, swap: false, snowbridge: false },
      packageManager: 'pnpm',
      privateKey,
      substrateMnemonic: '//Alice',
    };

    await runInteractiveCli(
      interactiveRoot,
      [
        { prompt: 'What would you like to build?', keys: '\u001B[B\r' },
        { prompt: 'Choose a framework', keys: '\u001B[B\u001B[B\r' },
        { prompt: 'Choose extensions', keys: ' \r' },
        { prompt: 'Name your project', keys: '\u0015interactive-api\r' },
        { prompt: 'Choose a package manager', keys: '\r' },
        { prompt: 'Configure a development wallet now?', keys: 'y\r' },
        { prompt: 'Your Substrate wallet mnemonic', keys: '//Alice\r' },
        { prompt: 'Your EVM wallet private key', keys: `${privateKey}\r` },
        { prompt: 'Continue with this configuration?', keys: '\r' },
      ],
      install.env,
    );

    await generateProject(testCase, expected, 'interactive-api');
    const actual = path.join(interactiveRoot, 'interactive-api');
    compareProjects(actual, expected);
    expectInstall(install.marker, actual);
  });
});
