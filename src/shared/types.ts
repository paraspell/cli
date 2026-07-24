export const FRAMEWORKS = ['react', 'vue', 'node'] as const;
export type TFramework = (typeof FRAMEWORKS)[number];

export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const;
export type TPackageManager = (typeof PACKAGE_MANAGERS)[number];

export const PROJECT_TYPES = ['sdk', 'api'] as const;
export type TProjectType = (typeof PROJECT_TYPES)[number];

export const SDK_CLIENTS = ['papi', 'pjs', 'dedot'] as const;
export type TSdkClient = (typeof SDK_CLIENTS)[number];

export const SDK_CLIENT_LABELS: Record<TSdkClient, string> = {
  papi: 'Polkadot API (PAPI)',
  pjs: 'Polkadot JS',
  dedot: 'Dedot',
};

export const EXTENSION_KEYS = ['evm', 'swap', 'snowbridge'] as const;
export type TExtensionKey = (typeof EXTENSION_KEYS)[number];
export type TExtensions = Record<TExtensionKey, boolean>;

export interface TSdkGenerateOptions {
  framework: TFramework;
  name: string;
  client: TSdkClient;
  extensions: TExtensions;
  packageManager: TPackageManager;
  out: string;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface TApiGenerateOptions {
  framework: TFramework;
  name: string;
  extensions: TExtensions;
  packageManager: TPackageManager;
  out: string;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface TResolveInput {
  kind: TProjectType;
  framework: TFramework;
  name?: string;
  client?: TSdkClient;
  extensions: Partial<TExtensions>;
  packageManager?: TPackageManager;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface TResolvedOptions {
  name: string;
  client?: TSdkClient;
  extensions: TExtensions;
  packageManager: TPackageManager;
  privateKey?: string;
  substrateMnemonic?: string;
}
