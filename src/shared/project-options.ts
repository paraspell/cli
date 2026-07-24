type TPromptOption = {
  label: string;
  hint: string;
};

type TFrameworkOption = TPromptOption & {
  startScript: 'dev' | 'start';
};

type TProjectTypeOption = TPromptOption & {
  defaultName: string;
  generatedDir: 'xcm-sdk' | 'xcm-api';
};

export const FRAMEWORKS = ['react', 'vue', 'node'] as const;
export type TFramework = (typeof FRAMEWORKS)[number];

export const FRAMEWORK_OPTIONS: Record<TFramework, TFrameworkOption> = {
  react: {
    label: 'React + Vite',
    hint: 'browser application',
    startScript: 'dev',
  },
  vue: {
    label: 'Vue + Vite',
    hint: 'browser application',
    startScript: 'dev',
  },
  node: {
    label: 'Node.js',
    hint: 'headless Express server',
    startScript: 'start',
  },
};

export const DEFAULT_FRAMEWORK: TFramework = 'react';

export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const;
export type TPackageManager = (typeof PACKAGE_MANAGERS)[number];

export const DEFAULT_PACKAGE_MANAGER: TPackageManager = 'pnpm';

export const isPackageManager = (value: string): value is TPackageManager =>
  PACKAGE_MANAGERS.some((packageManager) => packageManager === value);

export const packageRunCommand = (packageManager: TPackageManager): string =>
  packageManager === 'npm' ? 'npm run' : packageManager;

export const PROJECT_TYPES = ['sdk', 'api'] as const;
export type TProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_OPTIONS: Record<TProjectType, TProjectTypeOption> = {
  sdk: {
    label: 'XCM SDK',
    hint: 'call ParaSpell directly from your app',
    defaultName: 'my-xcm-app',
    generatedDir: 'xcm-sdk',
  },
  api: {
    label: 'XCM API',
    hint: 'REST API that builds transfers while you sign them locally',
    defaultName: 'my-xcm-api-app',
    generatedDir: 'xcm-api',
  },
};

export const DEFAULT_PROJECT_TYPE: TProjectType = 'sdk';

export const SDK_CLIENTS = ['papi', 'pjs', 'dedot'] as const;
export type TSdkClient = (typeof SDK_CLIENTS)[number];

export const SDK_CLIENT_OPTIONS: Record<TSdkClient, TPromptOption> = {
  papi: {
    label: 'Polkadot API',
    hint: 'PAPI client, recommended',
  },
  pjs: {
    label: 'Polkadot JS',
    hint: 'PJS client',
  },
  dedot: {
    label: 'Dedot',
    hint: 'Dedot client',
  },
};

export const DEFAULT_SDK_CLIENT: TSdkClient = 'papi';

export const EXTENSION_KEYS = ['evm', 'swap', 'snowbridge'] as const;
export type TExtensionKey = (typeof EXTENSION_KEYS)[number];
export type TExtensions = Record<TExtensionKey, boolean>;

export const EXTENSION_OPTIONS: Record<TExtensionKey, TPromptOption> = {
  evm: {
    label: 'EVM',
    hint: 'use EVM chains as origins',
  },
  swap: {
    label: 'Swap',
    hint: 'cross-chain swaps via @paraspell/swap',
  },
  snowbridge: {
    label: 'Snowbridge',
    hint: 'transfers between Ethereum and Polkadot',
  },
};

export const resolveExtensions = (
  explicit: Partial<TExtensions>,
  selected: readonly TExtensionKey[] = [],
): TExtensions => ({
  evm: explicit.evm ?? selected.includes('evm'),
  swap: explicit.swap ?? selected.includes('swap'),
  snowbridge: explicit.snowbridge ?? selected.includes('snowbridge'),
});
