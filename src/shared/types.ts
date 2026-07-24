import type {
  TExtensions,
  TFramework,
  TPackageManager,
  TProjectType,
  TSdkClient,
} from './project-options.js';

export type TGenerateOptions = {
  framework: TFramework;
  name: string;
  client: TSdkClient;
  extensions: TExtensions;
  packageManager: TPackageManager;
  out: string;
  privateKey?: string;
  substrateMnemonic?: string;
};

export type TResolveInput = {
  kind: TProjectType;
  framework: TFramework;
  name?: string;
  client?: TSdkClient;
  extensions: Partial<TExtensions>;
  packageManager?: TPackageManager;
  privateKey?: string;
  substrateMnemonic?: string;
};

export type TResolvedOptions = Omit<TGenerateOptions, 'framework' | 'out'>;
