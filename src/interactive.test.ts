import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, text } from '@clack/prompts';

type TGenerateApp = typeof import('./generator/generate.js').generateApp;

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const generateApp = vi.fn<TGenerateApp>();
const promptExtensions = vi.fn(() => Promise.resolve<string[]>([]));
const promptSubstrateMnemonic = vi.fn(() =>
  Promise.resolve<string | undefined>(undefined),
);
const promptEvmPrivateKey = vi.fn(() =>
  Promise.resolve<string | undefined>(undefined),
);

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock('./generator/generate.js', () => ({
  generateApp: (params: Parameters<TGenerateApp>[0]) => generateApp(params),
}));

vi.mock('./shared/extensions-checkbox.js', () => ({
  EVM_EXTENSION: 'evm-extension',
  SWAP_EXTENSION: 'swap-extension',
  SNOWBRIDGE_EXTENSION: 'snowbridge-extension',
  promptExtensions: () => promptExtensions(),
}));

vi.mock('./shared/prompt-secrets.js', () => ({
  promptSubstrateMnemonic: () => promptSubstrateMnemonic(),
  promptEvmPrivateKey: () => promptEvmPrivateKey(),
}));

const { runInteractiveGenerate } = await import('./interactive.js');

const mockedText = vi.mocked(text);
const mockedSelect = vi.mocked(select);
describe('runInteractiveGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateApp.mockResolvedValue(undefined);
    promptExtensions.mockResolvedValue([]);
    promptSubstrateMnemonic.mockResolvedValue(undefined);
    promptEvmPrivateKey.mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('scaffolds an sdk app from wizard answers', async () => {
    mockedText.mockResolvedValue('wizard-app');
    mockedSelect
      .mockResolvedValueOnce('npm')
      .mockResolvedValueOnce('react')
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('papi');

    await runInteractiveGenerate();

    expect(mockedSelect.mock.calls[3]?.[0].options).toContainEqual({
      value: 'papi',
      label: 'Polkadot API (PAPI)',
    });
    expect(generateApp).toHaveBeenCalledOnce();
    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      kind: 'sdk',
      opts: {
        framework: 'react',
        name: 'wizard-app',
        client: 'papi',
        packageManager: 'npm',
        out: path.join(process.cwd(), 'wizard-app'),
      },
    });
  });

  it('scaffolds an api app without prompting for a client', async () => {
    mockedText.mockResolvedValue('api-wizard');
    mockedSelect
      .mockResolvedValueOnce('pnpm')
      .mockResolvedValueOnce('vue')
      .mockResolvedValueOnce('api');

    await runInteractiveGenerate();

    expect(mockedSelect).toHaveBeenCalledTimes(3);
    expect(generateApp).toHaveBeenCalledOnce();
    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      kind: 'api',
      opts: { framework: 'vue', name: 'api-wizard' },
    });
  });

  it('prompts for node secrets when EVM extensions are enabled', async () => {
    mockedText.mockResolvedValue('node-app');
    mockedSelect
      .mockResolvedValueOnce('pnpm')
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('papi');
    promptExtensions.mockResolvedValue(['evm-extension']);
    promptSubstrateMnemonic.mockResolvedValue('//Alice');
    promptEvmPrivateKey.mockResolvedValue(VALID_PRIVATE_KEY);

    await runInteractiveGenerate();

    expect(promptSubstrateMnemonic).toHaveBeenCalledOnce();
    expect(promptEvmPrivateKey).toHaveBeenCalledOnce();
    expect(generateApp.mock.calls[0]?.[0]).toMatchObject({
      kind: 'sdk',
      opts: {
        framework: 'node',
        extensions: { evm: true },
        substrateMnemonic: '//Alice',
        privateKey: VALID_PRIVATE_KEY,
      },
    });
  });
});
