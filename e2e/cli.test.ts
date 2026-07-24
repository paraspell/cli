import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('CLI', () => {
  it('prints help', async () => {
    const { stdout } = await execFileAsync(process.execPath, [
      path.resolve('dist/index.js'),
      '--help',
    ]);

    expect(stdout).toContain('create-paraspell');
    expect(stdout).toContain('Scaffold ParaSpell XCM SDK and XCM API');
  });
});
