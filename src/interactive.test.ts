import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runInteractiveGenerate } from './interactive.js';
import { runProjectFlow } from './shared/project-flow.js';
import { promptProjectBasics } from './shared/prompts.js';

vi.mock('./shared/project-flow.js');
vi.mock('./shared/prompts.js');

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
    expect(options?.input).toEqual({
      kind: 'api',
      framework: 'vue',
      extensions: {},
    });
    expect(options?.resolveOut('example')).toBe(
      path.join('/workspace', 'example'),
    );
    expect(
      options?.validateTarget?.(
        'valid-name',
        path.join('/workspace', 'valid-name'),
      ),
    ).toBe(true);

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    expect(
      options?.validateTarget?.('taken', path.join('/workspace', 'taken')),
    ).toBe(`Project already exists: ${path.join('/workspace', 'taken')}`);
  });
});
