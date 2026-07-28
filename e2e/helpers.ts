import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { expect } from 'vitest';
import {
  EXTENSION_KEYS,
  type TPackageManager,
} from '../src/shared/project-options.js';
import { caseId, type TGenerationCase } from './matrix.js';

const CLI_PATH = path.resolve('dist/index.js');
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_COMMAND_OUTPUT = 20 * 1024 * 1024;

type TInteractiveAnswer = {
  prompt: string;
  keys: string;
};

type TCommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

export const createTemporaryRoot = (label: string): string =>
  fs.mkdtempSync(path.join(os.tmpdir(), `paraspell-${label}-`));

export const removeTemporaryRoot = (root: string): void => {
  fs.rmSync(root, { recursive: true, force: true });
};

export const runCommand = async (
  command: string,
  args: readonly string[],
  options: TCommandOptions = {},
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    const append = (current: string, chunk: Buffer): string =>
      `${current}${chunk.toString()}`.slice(-MAX_COMMAND_OUTPUT);
    child.stdout.on('data', (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out after ${COMMAND_TIMEOUT_MS}ms`));
    }, COMMAND_TIMEOUT_MS);

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const detail = [stdout, stderr].filter(Boolean).join('\n');
      reject(
        new Error(
          `${command} ${args.join(' ')} exited with code ${code}${detail ? `\n${detail}` : ''}`,
        ),
      );
    });
  });
};

const cliArgs = (
  testCase: TGenerationCase,
  name: string,
  outDir: string,
): string[] => {
  const args = [
    testCase.kind,
    testCase.framework,
    '--name',
    name,
    '--package-manager',
    testCase.packageManager,
    '--out',
    outDir,
  ];

  if (testCase.client) args.push('--client', testCase.client);
  if (testCase.privateKey) args.push('--private-key', testCase.privateKey);
  if (testCase.substrateMnemonic) {
    args.push('--substrate-mnemonic', testCase.substrateMnemonic);
  }
  for (const extension of EXTENSION_KEYS) {
    if (testCase.extensions[extension]) args.push(`--${extension}`);
  }

  return args;
};

export const generateProject = async (
  testCase: TGenerationCase,
  outDir: string,
  name = caseId(testCase),
): Promise<void> => {
  await runCommand(process.execPath, [
    CLI_PATH,
    ...cliArgs(testCase, name, outDir),
  ]);
};

const listFiles = (root: string, current = root): string[] => {
  const files: string[] = [];

  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(root, absolutePath));
    } else {
      files.push(path.relative(root, absolutePath));
    }
  }

  return files.sort();
};

export const compareProjects = (actual: string, expected: string): void => {
  const actualFiles = listFiles(actual);
  const expectedFiles = listFiles(expected);
  expect(actualFiles).toEqual(expectedFiles);

  for (const file of actualFiles) {
    expect(fs.readFileSync(path.join(actual, file)), file).toEqual(
      fs.readFileSync(path.join(expected, file)),
    );
  }
};

export const createFakePackageManager = (
  root: string,
  packageManager: TPackageManager,
): { env: NodeJS.ProcessEnv; marker: string } => {
  const binDir = path.join(root, 'bin');
  const marker = path.join(root, `${packageManager}-install.json`);
  const executable = path.join(binDir, packageManager);
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(
    executable,
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(process.env.E2E_INSTALL_MARKER, JSON.stringify({
  args: process.argv.slice(2),
  cwd: process.cwd(),
}));
`,
    { mode: 0o755 },
  );

  return {
    env: {
      ...process.env,
      E2E_INSTALL_MARKER: marker,
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}`,
    },
    marker,
  };
};

const waitForPrompt = async (
  output: () => string,
  finished: () => boolean,
  prompt: string,
): Promise<void> => {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (stripVTControlCharacters(output()).includes(prompt)) return;
    if (finished()) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(
    `Interactive prompt not found: ${prompt}\n${stripVTControlCharacters(output())}`,
  );
};

export const runInteractiveCli = async (
  cwd: string,
  answers: readonly TInteractiveAnswer[],
  env: NodeJS.ProcessEnv,
): Promise<string> => {
  const child = spawn(process.execPath, [CLI_PATH], {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let output = '';
  let finished = false;

  child.stdout.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });

  const completion = new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      finished = true;
      if (code === 0) resolve();
      else
        reject(
          new Error(`Interactive CLI exited with code ${code}\n${output}`),
        );
    });
  });

  try {
    for (const answer of answers) {
      await waitForPrompt(
        () => output,
        () => finished,
        answer.prompt,
      );
      child.stdin.write(answer.keys);
    }
    await completion;
    return stripVTControlCharacters(output);
  } catch (error) {
    child.kill();
    await completion.catch(() => undefined);
    throw error;
  }
};
