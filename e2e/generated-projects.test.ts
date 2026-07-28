import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PACKAGE_MANAGERS,
  type TPackageManager,
} from '../src/shared/project-options.js';
import {
  createTemporaryRoot,
  generateProject,
  removeTemporaryRoot,
  runCommand,
} from './helpers.js';
import { BUILD_CASES, caseId, type TGenerationCase } from './matrix.js';

type TPackageManagerCommands = {
  install: readonly string[];
  build: readonly string[];
};

const PACKAGE_MANAGER_COMMANDS: Record<
  TPackageManager,
  TPackageManagerCommands
> = {
  npm: { install: ['install'], build: ['run', 'build'] },
  yarn: { install: ['install'], build: ['build'] },
  pnpm: {
    install: ['install', '--frozen-lockfile=false'],
    build: ['build'],
  },
  bun: { install: ['install'], build: ['run', 'build'] },
};
const GENERATION_CASES = BUILD_CASES.map(
  (testCase) => [caseId(testCase), testCase] as const,
);

let root: string;
let projectsRoot: string;
const projectPath = (testCase: TGenerationCase): string =>
  path.join(projectsRoot, caseId(testCase));

beforeAll(() => {
  root = createTemporaryRoot('matrix');
  projectsRoot = path.join(root, 'projects');
});

afterAll(() => {
  removeTemporaryRoot(root);
});

describe('generated projects', () => {
  it('defines a complete matrix with unique project IDs', () => {
    expect(BUILD_CASES).toHaveLength(96);
    const ids = BUILD_CASES.map(caseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(GENERATION_CASES)('generates %s', async (_, testCase) => {
    await generateProject(testCase, projectPath(testCase));
  });

  it('builds every supported project combination', async () => {
    const firstWorkspace = projectPath(BUILD_CASES[0]);
    const allowBuilds = fs.readFileSync(
      path.join(firstWorkspace, 'pnpm-workspace.yaml'),
      'utf8',
    );

    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'generated-projects', private: true }),
    );
    fs.writeFileSync(
      path.join(root, 'pnpm-workspace.yaml'),
      `packages:
  - projects/*-pnpm
overrides:
  "@polkadot-api/json-rpc-provider": ^0.2.0
${allowBuilds}`,
    );

    await runCommand('pnpm', ['install', '--frozen-lockfile=false'], {
      cwd: root,
    });
    await runCommand(
      'pnpm',
      ['--recursive', '--workspace-concurrency=4', 'run', 'build'],
      { cwd: root },
    );
  });

  const installAndBuild = async (
    testCase: TGenerationCase,
    commands: TPackageManagerCommands,
  ): Promise<void> => {
    const caseRoot = createTemporaryRoot(`standalone-${caseId(testCase)}`);
    const project = path.join(caseRoot, 'project');
    try {
      await generateProject(testCase, project);
      await runCommand(testCase.packageManager, commands.install, {
        cwd: project,
      });
      await runCommand(testCase.packageManager, commands.build, {
        cwd: project,
      });
    } finally {
      removeTemporaryRoot(caseRoot);
    }
  };

  it.each(PACKAGE_MANAGERS)(
    'installs and builds with %s',
    async (packageManager) => {
      await installAndBuild(
        {
          kind: 'api',
          framework: 'node',
          extensions: { evm: false, swap: false, snowbridge: false },
          packageManager,
        },
        PACKAGE_MANAGER_COMMANDS[packageManager],
      );
    },
  );
});
