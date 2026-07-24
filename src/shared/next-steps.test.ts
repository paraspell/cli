import { note, outro } from '@clack/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { printNextSteps, type TInstallationStatus } from './next-steps.js';

vi.mock('@clack/prompts');

const nextStepCases: [TInstallationStatus, string, boolean][] = [
  ['installed', 'npm run dev', false],
  ['skipped', 'pnpm start', true],
  ['failed', 'yarn dev', true],
];

describe('printNextSteps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(nextStepCases)(
    'prints commands for an %s project',
    (installation, runCommand, needsInstall) => {
      printNextSteps({
        outDir: 'example',
        packageManager:
          installation === 'installed'
            ? 'npm'
            : installation === 'failed'
              ? 'yarn'
              : 'pnpm',
        framework: installation === 'skipped' ? 'node' : 'react',
        installation,
      });

      const output = vi.mocked(note).mock.calls[0]?.[0] ?? '';
      expect(output).toContain(runCommand);
      expect(output.includes(' install')).toBe(needsInstall);
      expect(outro).toHaveBeenCalledWith(
        installation === 'failed'
          ? expect.stringContaining('Install dependencies')
          : expect.stringContaining('is ready'),
      );
    },
  );
});
