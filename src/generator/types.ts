import type { Code } from 'ts-poet';
import type {
  TExtensions,
  TFramework,
  TPackageManager,
  TProjectType,
  TSdkClient,
  TSdkClientName,
} from '../shared/project-options.js';
import type { TGenerateOptions } from '../shared/types.js';
import type { TPackageVersions } from './versions.js';

export type TGenerateAppParams = {
  kind: TProjectType;
  opts: TGenerateOptions;
};

export type TSdkPackage =
  '@paraspell/sdk' | '@paraspell/sdk-pjs' | '@paraspell/sdk-dedot';

export type TTemplateContext = TPackageVersions & {
  client: TSdkClient;
  clientName: TSdkClientName;
  sdkPackage: TSdkPackage;
  sdkVersion: string;
  clientLabel: string;
  projectName: string;
  packageManager: TPackageManager;
  installCmd: string;
  startCmd: string;
  framework: TFramework;
  projectKind: TProjectType;
  extensions: TExtensions;
  evmWallet: boolean;
  defaultOriginChain: 'Astar' | 'Moonbeam' | 'Ethereum';
};

export type TTemplateFile = {
  path: string;
  skip?: boolean;
  render: () => Code;
};
