export type Framework = 'react' | 'vue' | 'node';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export type ProjectType = 'sdk' | 'api';

export type SdkClient = 'papi' | 'pjs' | 'dedot';

export interface FeatureFlags {
  evm: boolean;
  swap: boolean;
  snowbridge: boolean;
}

export interface SdkGenerateOptions extends FeatureFlags {
  framework: Framework;
  name: string;
  client: SdkClient;
  packageManager: PackageManager;
  out: string;
  help?: boolean;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface ApiGenerateOptions extends FeatureFlags {
  framework: Framework;
  name: string;
  packageManager: PackageManager;
  out: string;
  help?: boolean;
  privateKey?: string;
  substrateMnemonic?: string;
}

export interface FrameworkMeta {
  generator: string;
  label: string;
  examplesSubdir: string;
  logoFile?: string;
}
