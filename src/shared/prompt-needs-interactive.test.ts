import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiNeedsInteractive } from './prompt-api.js';
import { sdkNeedsInteractive } from './prompt-sdk.js';

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function withTty(isTTY: boolean, run: () => void): void {
  vi.stubGlobal('process', { ...process, stdin: { isTTY } });
  run();
  vi.unstubAllGlobals();
}

describe('sdkNeedsInteractive', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when all sdk flags are provided on a TTY', () => {
    withTty(true, () => {
      expect(
        sdkNeedsInteractive(
          [
            '--package-manager',
            'npm',
            '--client',
            'pjs',
            '--evm',
            '--name',
            'my-app',
          ],
          { framework: 'react' },
        ),
      ).toBe(false);
    });
  });

  it('returns true when a required flag is missing on a TTY', () => {
    withTty(true, () => {
      expect(
        sdkNeedsInteractive(['--package-manager', 'npm', '--evm'], {
          framework: 'react',
        }),
      ).toBe(true);
    });
  });

  it('returns true when --name has an invalid value on a TTY', () => {
    withTty(true, () => {
      expect(
        sdkNeedsInteractive(
          [
            '--package-manager',
            'npm',
            '--client',
            'pjs',
            '--evm',
            '--name',
            'Invalid Name',
          ],
          { framework: 'react', name: 'Invalid Name' },
        ),
      ).toBe(true);
    });
  });

  it('returns false when stdin is not a TTY even if flags are missing', () => {
    withTty(false, () => {
      expect(sdkNeedsInteractive([], { framework: 'react' })).toBe(false);
    });
  });

  it('requires node secrets on a TTY when EVM wallet origins are enabled', () => {
    withTty(true, () => {
      const nodePartial = { framework: 'node' as const, evm: true };

      expect(
        sdkNeedsInteractive(
          [
            '--package-manager',
            'npm',
            '--client',
            'pjs',
            '--evm',
            '--name',
            'node-app',
          ],
          nodePartial,
        ),
      ).toBe(true);

      expect(
        sdkNeedsInteractive(
          [
            '--package-manager',
            'npm',
            '--client',
            'pjs',
            '--evm',
            '--name',
            'node-app',
            '--substrate-mnemonic',
            'seed',
          ],
          nodePartial,
        ),
      ).toBe(true);

      expect(
        sdkNeedsInteractive(
          [
            '--package-manager',
            'npm',
            '--client',
            'pjs',
            '--evm',
            '--name',
            'node-app',
            '--substrate-mnemonic',
            'seed',
            '--private-key',
            '0xabc',
          ],
          nodePartial,
        ),
      ).toBe(true);

      expect(
        sdkNeedsInteractive(
          [
            '--package-manager',
            'npm',
            '--client',
            'pjs',
            '--evm',
            '--name',
            'node-app',
            '--substrate-mnemonic',
            '//Alice',
            '--private-key',
            VALID_PRIVATE_KEY,
          ],
          {
            ...nodePartial,
            substrateMnemonic: '//Alice',
            privateKey: VALID_PRIVATE_KEY,
          },
        ),
      ).toBe(false);
    });
  });
});

describe('apiNeedsInteractive', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when all api flags are provided on a TTY', () => {
    withTty(true, () => {
      expect(
        apiNeedsInteractive(
          ['--package-manager', 'npm', '--evm', '--name', 'my-app'],
          { framework: 'react' },
        ),
      ).toBe(false);
    });
  });

  it('returns false when stdin is not a TTY even if flags are missing', () => {
    withTty(false, () => {
      expect(apiNeedsInteractive([], { framework: 'react' })).toBe(false);
    });
  });

  it('requires node secrets on a TTY when wallet origins are enabled', () => {
    withTty(true, () => {
      expect(
        apiNeedsInteractive(
          ['--package-manager', 'npm', '--snowbridge', '--name', 'node-api'],
          { framework: 'node', snowbridge: true },
        ),
      ).toBe(true);
    });
  });
});
