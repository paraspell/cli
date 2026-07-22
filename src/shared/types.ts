export const FRAMEWORKS = ["react", "vue", "node"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const PROJECT_TYPES = ["sdk", "api"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const SDK_CLIENTS = ["papi", "pjs", "dedot"] as const;
export type SdkClient = (typeof SDK_CLIENTS)[number];

export const SDK_CLIENT_LABELS: Record<SdkClient, string> = {
  papi: "Polkadot API",
  pjs: "Polkadot JS",
  dedot: "Dedot",
};

export const FEATURE_KEYS = ["evm", "swap", "snowbridge"] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type FeatureFlags = Record<FeatureKey, boolean>;

export interface SdkGenerateOptions extends FeatureFlags {
  framework: Framework;
  name: string;
  client: SdkClient;
  packageManager: PackageManager;
  out: string;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface ApiGenerateOptions extends FeatureFlags {
  framework: Framework;
  name: string;
  packageManager: PackageManager;
  out: string;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface ResolveInput {
  kind: ProjectType;
  framework: Framework;
  name?: string;
  client?: SdkClient;
  evm?: boolean;
  swap?: boolean;
  snowbridge?: boolean;
  packageManager?: PackageManager;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface ResolvedOptions {
  name: string;
  client?: SdkClient;
  evm: boolean;
  swap: boolean;
  snowbridge: boolean;
  packageManager: PackageManager;
  privateKey?: string;
  substrateMnemonic?: string;
}
