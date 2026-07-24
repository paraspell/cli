import fs from 'node:fs';
import path from 'node:path';
import { intro } from '@clack/prompts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runInteractiveGenerate } from './interactive.js';
import { runProjectFlow } from './shared/project-flow.js';
import { promptProjectBasics } from './shared/prompts.js';
import type { TResolvedOptions } from './shared/types.js';

vi.mock('@clack/prompts');
vi.mock('./shared/project-flow.js');
vi.mock('./shared/prompts.js');

const resolved: TResolvedOptions = {
  name: 'example',
  client: 'papi',
  packageManager: 'pnpm',
  extensions: { evm: false, swap: false, snowbridge: false },
  privateKey: undefined,
  substrateMnemonic: undefined,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runInteractiveGenerate', () => {
  it('starts an interactive project flow in the current directory', async () => {
    vi.mocked(promptProjectBasics).mockResolvedValue({
      projectType: 'api',
      framework: 'vue',
    });
    vi.mocked(runProjectFlow).mockResolvedValue();
    vi.spyOn(process, 'cwd').mockReturnValue('/workspace');

    await runInteractiveGenerate();

    const options = vi.mocked(runProjectFlow).mock.calls[0]?.[0];
    expect(intro).toHaveBeenCalled();
    expect(options?.input).toEqual({
      kind: 'api',
      framework: 'vue',
      extensions: {},
    });
    expect(options?.resolveOut(resolved)).toBe(
      path.join('/workspace', 'example'),
    );
    expect(options?.validateName?.('valid-name')).toBe(true);

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    expect(options?.validateName?.('taken')).toBe(
      `Project already exists: ${path.join('/workspace', 'taken')}`,
    );
  });
});
