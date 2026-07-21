import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateNeedsInteractive } from './prompt-options.js';
import type { ResolveInput } from './types.js';

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const withTty = (isTTY: boolean, run: () => void): void => {
  vi.stubGlobal('process', { ...process, stdin: { isTTY } });
  run();
  vi.unstubAllGlobals();
};

const sdkComplete: ResolveInput = {
  kind: 'sdk',
  framework: 'react',
  name: 'my-app',
  packageManager: 'npm',
  client: 'pjs',
  evm: true,
};

describe('generateNeedsInteractive (sdk)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when every sdk option is provided on a TTY', () => {
    withTty(true, () => {
      expect(generateNeedsInteractive(sdkComplete)).toBe(false);
    });
  });

  it('is true when a required option is missing on a TTY', () => {
    withTty(true, () => {
      expect(
        generateNeedsInteractive({
          kind: 'sdk',
          framework: 'react',
          packageManager: 'npm',
          evm: true,
        }),
      ).toBe(true);
    });
  });

  it('is true when --name is invalid on a TTY', () => {
    withTty(true, () => {
      expect(
        generateNeedsInteractive({ ...sdkComplete, name: 'Invalid Name' }),
      ).toBe(true);
    });
  });

  it('is false when stdin is not a TTY even if options are missing', () => {
    withTty(false, () => {
      expect(
        generateNeedsInteractive({ kind: 'sdk', framework: 'react' }),
      ).toBe(false);
    });
  });

  it('requires node secrets on a TTY when EVM wallet origins are enabled', () => {
    const node: ResolveInput = {
      kind: 'sdk',
      framework: 'node',
      name: 'node-app',
      packageManager: 'npm',
      client: 'pjs',
      evm: true,
    };
    withTty(true, () => {
      expect(generateNeedsInteractive(node)).toBe(true);
      expect(
        generateNeedsInteractive({ ...node, substrateMnemonic: '//Alice' }),
      ).toBe(true);
      expect(
        generateNeedsInteractive({
          ...node,
          substrateMnemonic: '//Alice',
          privateKey: VALID_PRIVATE_KEY,
        }),
      ).toBe(false);
    });
  });
});

describe('generateNeedsInteractive (api)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when every api option is provided on a TTY', () => {
    withTty(true, () => {
      expect(
        generateNeedsInteractive({
          kind: 'api',
          framework: 'react',
          name: 'my-app',
          packageManager: 'npm',
          evm: true,
        }),
      ).toBe(false);
    });
  });

  it('is false when stdin is not a TTY even if options are missing', () => {
    withTty(false, () => {
      expect(
        generateNeedsInteractive({ kind: 'api', framework: 'react' }),
      ).toBe(false);
    });
  });

  it('requires node secrets on a TTY when wallet origins are enabled', () => {
    withTty(true, () => {
      expect(
        generateNeedsInteractive({
          kind: 'api',
          framework: 'node',
          name: 'node-api',
          packageManager: 'npm',
          snowbridge: true,
        }),
      ).toBe(true);
    });
  });
});
