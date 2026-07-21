import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select, text } from '@clack/prompts';

type GenerateSdkApp = typeof import('./shared/hygen-runner.js').generateSdkApp;
type GenerateApiApp = typeof import('./shared/hygen-runner.js').generateApiApp;

const VALID_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const generateSdkApp = vi.fn<GenerateSdkApp>();
const generateApiApp = vi.fn<GenerateApiApp>();
const promptFeatureExtensions = vi.fn(async (_defaults?: unknown) => [] as string[]);
const promptSubstrateMnemonic = vi.fn(async () => undefined as string | undefined);
const promptEvmPrivateKey = vi.fn(async () => undefined as string | undefined);

vi.mock('terminal-image', () => ({
  default: { buffer: vi.fn(async () => '') },
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock('./shared/hygen-runner.js', () => ({
  generateSdkApp: (params: Parameters<GenerateSdkApp>[0]) =>
    generateSdkApp(params),
  generateApiApp: (params: Parameters<GenerateApiApp>[0]) =>
    generateApiApp(params),
}));

vi.mock('./shared/feature-extensions-checkbox.js', () => ({
  EVM_EXTENSION: 'evm-extension',
  SWAP_EXTENSION: 'swap-extension',
  SNOWBRIDGE_EXTENSION: 'snowbridge-extension',
  promptFeatureExtensions: (defaults?: unknown) =>
    promptFeatureExtensions(defaults),
}));

vi.mock('./shared/prompt-secrets.js', () => ({
  promptSubstrateMnemonic: () => promptSubstrateMnemonic(),
  promptEvmPrivateKey: () => promptEvmPrivateKey(),
}));

const { runInteractiveGenerate } = await import('./interactive.js');

const mockedText = vi.mocked(text);
const mockedSelect = vi.mocked(select);
const TEMPLATES_ROOT = path.join(process.cwd(), '_templates');

describe('runInteractiveGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateSdkApp.mockResolvedValue(undefined);
    generateApiApp.mockResolvedValue(undefined);
    promptFeatureExtensions.mockResolvedValue([]);
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

    await runInteractiveGenerate(TEMPLATES_ROOT);

    expect(generateApiApp).not.toHaveBeenCalled();
    expect(generateSdkApp).toHaveBeenCalledOnce();
    expect(generateSdkApp.mock.calls[0]?.[0]).toMatchObject({
      templatesRoot: TEMPLATES_ROOT,
      opts: expect.objectContaining({
        framework: 'react',
        name: 'wizard-app',
        client: 'papi',
        packageManager: 'npm',
        out: path.join(process.cwd(), 'wizard-app'),
      }),
    });
  });

  it('scaffolds an api app without prompting for a client', async () => {
    mockedText.mockResolvedValue('api-wizard');
    mockedSelect
      .mockResolvedValueOnce('pnpm')
      .mockResolvedValueOnce('vue')
      .mockResolvedValueOnce('api');

    await runInteractiveGenerate(TEMPLATES_ROOT);

    expect(mockedSelect).toHaveBeenCalledTimes(3);
    expect(generateSdkApp).not.toHaveBeenCalled();
    expect(generateApiApp).toHaveBeenCalledOnce();
    expect(generateApiApp.mock.calls[0]?.[0]).toMatchObject({
      opts: expect.objectContaining({ framework: 'vue', name: 'api-wizard' }),
    });
  });

  it('prompts for node secrets when EVM features are enabled', async () => {
    mockedText.mockResolvedValue('node-app');
    mockedSelect
      .mockResolvedValueOnce('pnpm')
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('papi');
    promptFeatureExtensions.mockResolvedValue(['evm-extension']);
    promptSubstrateMnemonic.mockResolvedValue('//Alice');
    promptEvmPrivateKey.mockResolvedValue(VALID_PRIVATE_KEY);

    await runInteractiveGenerate(TEMPLATES_ROOT);

    expect(promptSubstrateMnemonic).toHaveBeenCalledOnce();
    expect(promptEvmPrivateKey).toHaveBeenCalledOnce();
    expect(generateSdkApp.mock.calls[0]?.[0]).toMatchObject({
      opts: expect.objectContaining({
        framework: 'node',
        evm: true,
        substrateMnemonic: '//Alice',
        privateKey: VALID_PRIVATE_KEY,
      }),
    });
  });
});
