import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirm, note, select, spinner, text } from '@clack/prompts';

type TGenerateApp = typeof import('./generator/generate.js').generateApp;
type TInstallDependencies =
  typeof import('./shared/install-dependencies.js').installDependencies;

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
const installDependencies = vi.fn<TInstallDependencies>(() =>
  Promise.resolve({ ok: true, output: '' }),
);

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clack/prompts')>();
  return {
    ...actual,
    intro: vi.fn(),
    outro: vi.fn(),
    note: vi.fn(),
    text: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      error: vi.fn(),
    })),
    log: { ...actual.log, warn: vi.fn() },
    cancel: vi.fn(),
    isCancel: vi.fn(() => false),
  };
});

vi.mock('./generator/generate.js', () => ({
  generateApp: (params: Parameters<TGenerateApp>[0]) => generateApp(params),
}));

vi.mock('./shared/extensions-checkbox.js', () => ({
  promptExtensions: () => promptExtensions(),
}));

vi.mock('./shared/prompt-secrets.js', () => ({
  promptSubstrateMnemonic: () => promptSubstrateMnemonic(),
  promptEvmPrivateKey: () => promptEvmPrivateKey(),
}));

vi.mock('./shared/install-dependencies.js', () => ({
  installDependencies: (
    projectDir: string,
    packageManager: Parameters<TInstallDependencies>[1],
  ) => installDependencies(projectDir, packageManager),
}));

const { runInteractiveGenerate } = await import('./interactive.js');

const mockedText = vi.mocked(text);
const mockedSelect = vi.mocked(select);
const mockedConfirm = vi.mocked(confirm);
describe('runInteractiveGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateApp.mockResolvedValue(undefined);
    installDependencies.mockResolvedValue({ ok: true, output: '' });
    promptExtensions.mockResolvedValue([]);
    promptSubstrateMnemonic.mockResolvedValue(undefined);
    promptEvmPrivateKey.mockResolvedValue(undefined);
    mockedConfirm.mockResolvedValue(true);
  });

  it('scaffolds an sdk app from wizard answers', async () => {
    mockedText.mockResolvedValue('wizard-app');
    mockedSelect
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('react')
      .mockResolvedValueOnce('papi')
      .mockResolvedValueOnce('npm');

    await runInteractiveGenerate();

    expect(mockedSelect.mock.calls[2]?.[0].options).toContainEqual(
      expect.objectContaining({
        value: 'papi',
        label: 'Polkadot API',
        hint: 'PAPI client, recommended',
      }),
    );
    expect(mockedSelect.mock.calls[2]?.[0].initialValue).toBe('papi');
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
    expect(installDependencies).toHaveBeenCalledWith(
      path.join(process.cwd(), 'wizard-app'),
      'npm',
    );
    expect(note).toHaveBeenCalledWith(
      expect.stringContaining('XCM SDK'),
      'Project summary',
    );
    expect(spinner).toHaveBeenCalledTimes(2);
  });

  it('scaffolds an api app without prompting for a client', async () => {
    mockedText.mockResolvedValue('api-wizard');
    mockedSelect
      .mockResolvedValueOnce('api')
      .mockResolvedValueOnce('vue')
      .mockResolvedValueOnce('pnpm');

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
      .mockResolvedValueOnce('sdk')
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('papi')
      .mockResolvedValueOnce('pnpm');
    promptExtensions.mockResolvedValue(['evm']);
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

  it('does not write files when the review is rejected', async () => {
    mockedText.mockResolvedValue('cancelled-app');
    mockedSelect
      .mockResolvedValueOnce('api')
      .mockResolvedValueOnce('react')
      .mockResolvedValueOnce('pnpm');
    mockedConfirm.mockResolvedValue(false);

    await runInteractiveGenerate();

    expect(generateApp).not.toHaveBeenCalled();
    expect(installDependencies).not.toHaveBeenCalled();
  });
});
