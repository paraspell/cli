import { describe, expect, it, vi } from 'vitest';
import {
  buildResolvedLogs,
  formatClientLabel,
  formatFeatureFlags,
  logResolvedPrompts,
} from './log-resolved-prompt.js';
import type { ResolveInput } from './types.js';

vi.mock('@clack/prompts', () => ({
  log: { success: vi.fn() },
}));

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const answersByMessage = (input: ResolveInput): Record<string, string> => {
  return Object.fromEntries(
    buildResolvedLogs(input).map((line) => [line.message, line.answer]),
  );
};

describe('formatters', () => {
  it('formats client labels', () => {
    expect(formatClientLabel('papi')).toBe('Polkadot API');
    expect(formatClientLabel('pjs')).toBe('Polkadot JS');
    expect(formatClientLabel('dedot')).toBe('Dedot');
  });

  it('formats feature flags, or "none"', () => {
    expect(
      formatFeatureFlags({ evm: true, swap: false, snowbridge: true }),
    ).toBe('EVM, Snowbridge');
    expect(
      formatFeatureFlags({ evm: false, swap: false, snowbridge: false }),
    ).toBe('none');
  });
});

describe('buildResolvedLogs', () => {
  it('logs every provided sdk option', () => {
    const answers = answersByMessage({
      kind: 'sdk',
      framework: 'react',
      name: 'my-app',
      packageManager: 'npm',
      client: 'pjs',
      evm: true,
    });
    expect(answers['Project name']).toBe('my-app');
    expect(answers['Package manager']).toBe('npm');
    expect(answers['JS client']).toBe('Polkadot JS');
    expect(answers['Additional features']).toBe('EVM');
  });

  it('omits an invalid --name', () => {
    const lines = buildResolvedLogs({
      kind: 'sdk',
      framework: 'react',
      name: 'Invalid Name',
    });
    expect(lines.some((line) => line.message === 'Project name')).toBe(false);
  });

  it('never logs a client for api projects', () => {
    const lines = buildResolvedLogs({
      kind: 'api',
      framework: 'react',
      client: 'pjs',
    });
    expect(lines.some((line) => line.message === 'JS client')).toBe(false);
  });

  it('logs node secrets when valid and EVM wallet origins are enabled', () => {
    const answers = answersByMessage({
      kind: 'sdk',
      framework: 'node',
      evm: true,
      substrateMnemonic: '//Alice',
      privateKey: VALID_PRIVATE_KEY,
    });
    expect(answers['Substrate mnemonic']).toBe('(provided via CLI)');
    expect(answers['EVM private key']).toBe('(provided via CLI)');
  });

  it('skips invalid node secrets', () => {
    const lines = buildResolvedLogs({
      kind: 'sdk',
      framework: 'node',
      evm: true,
      substrateMnemonic: 'not-a-mnemonic',
      privateKey: 'nope',
    });
    expect(lines.some((line) => line.message === 'Substrate mnemonic')).toBe(
      false,
    );
    expect(lines.some((line) => line.message === 'EVM private key')).toBe(
      false,
    );
  });
});

describe('logResolvedPrompts', () => {
  it('does not throw for an empty input', () => {
    expect(() =>
      logResolvedPrompts({ kind: 'sdk', framework: 'react' }),
    ).not.toThrow();
  });
});
