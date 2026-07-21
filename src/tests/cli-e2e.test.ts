import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { runCommand } from './run-project.js';

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const CLI_ENTRY = path.join(PACKAGE_ROOT, 'src/index.ts');
const CLI_TIMEOUT_MS = 120_000;

const runCli = async (
  args: string[],
  cwd = PACKAGE_ROOT,
): Promise<{ ok: boolean; output: string; code: number }> => {
  const result = await runCommand(
    cwd,
    path.join(PACKAGE_ROOT, 'node_modules/.bin/tsx'),
    [CLI_ENTRY, ...args],
    CLI_TIMEOUT_MS,
  );
  return {
    ...result,
    code: result.ok ? 0 : 1,
  };
}

describe('CLI subprocess', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('prints main help for bare --help', async () => {
    const result = await runCli(['--help']);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('create-paraspell sdk');
    expect(result.output).toContain('create-paraspell api');
  });

  it('prints sdk help without generating a project', async () => {
    const result = await runCli(['sdk', '--help']);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('create-paraspell sdk');
    expect(result.output).toContain('--client');
    expect(result.output).toContain('--substrate-mnemonic');
    expect(result.output).toContain('--private-key');
  });

  it('prints api help without generating a project', async () => {
    const result = await runCli(['api', '--help']);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('create-paraspell api');
    expect(result.output).not.toContain('--client');
    expect(result.output).toContain('--substrate-mnemonic');
    expect(result.output).toContain('--private-key');
  });

  it('exits non-zero for orphan flags without sdk|api', async () => {
    const result = await runCli(['--name', 'orphan']);
    expect(result.ok).toBe(false);
    expect(result.output).toContain('No command registered');
  });

  it('rejects unknown positional framework values', async () => {
    const result = await runCli(['sdk', 'angular', '--name', 'bad']);
    expect(result.ok).toBe(false);
    expect(result.output).toContain('Unknown framework "angular"');
  });

  it('rejects invalid project names in consumer mode', async () => {
    const result = await runCli([
      'sdk',
      'react',
      '--name',
      'Invalid Name',
      '--package-manager',
      'npm',
      '--client',
      'pjs',
      '--evm',
    ]);
    expect(result.ok).toBe(false);
    expect(result.output).toMatch(/Invalid project name|Project name is required/);
  });

  it('generates a sdk app from framework and flags', async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-cli-e2e-'));
    tmpDirs.push(tmpRoot);
    const projectName = 'cli-e2e-sdk-app';
    const outDir = path.join(tmpRoot, projectName);

    const result = await runCli(
      [
        'sdk',
        'react',
        '--name',
        projectName,
        '--package-manager',
        'npm',
        '--client',
        'pjs',
        '--evm',
        '--out',
        outDir,
      ],
      tmpRoot,
    );

    expect(result.ok).toBe(true);
    expect(result.output).toContain('Next steps:');
    expect(fs.existsSync(path.join(outDir, 'package.json'))).toBe(true);
  });

  it('fails when the consumer target directory already exists', async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'paraspell-cli-e2e-'));
    tmpDirs.push(tmpRoot);
    const projectName = 'existing-app';
    const outDir = path.join(tmpRoot, projectName);
    fs.mkdirSync(outDir);

    const result = await runCli(
      [
        'sdk',
        'react',
        '--name',
        projectName,
        '--package-manager',
        'npm',
        '--client',
        'pjs',
        '--evm',
      ],
      tmpRoot,
    );

    expect(result.ok).toBe(false);
    expect(result.output).toContain('Project already exists');
  });
});
