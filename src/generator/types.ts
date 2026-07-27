import type { Code } from 'ts-poet';
import type {
  TExtensions,
  TFramework,
  TPackageManager,
  TProjectType,
  TSdkClient,
} from '../shared/project-options.js';
import type { TGenerateOptions } from '../shared/types.js';
import type { TPackageVersions } from './versions.js';

export type TTemplateSetId = `xcm-${TProjectType}-${TFramework}`;

export type TGeneratorTarget = {
  templateSet: TTemplateSetId;
  assetFiles?: readonly string[];
};

export type TGenerateAppParams = {
  kind: TProjectType;
  opts: TGenerateOptions;
};

export type TSdkPackage =
  '@paraspell/sdk' | '@paraspell/sdk-pjs' | '@paraspell/sdk-dedot';

export type TClientMeta = {
  client: TSdkClient;
  sdkPackage: TSdkPackage;
  sdkVersion: string;
  clientLabel: string;
};

export type TTemplateContext = TPackageVersions &
  TClientMeta & {
    projectName: string;
    packageManager: TPackageManager;
    installCmd: string;
    devCmd: string;
    startCmd: string;
    framework: TFramework;
    projectKind: TProjectType;
    extensions: TExtensions;
    evmWallet: boolean;
  };

export type TTemplateFile = {
  path: string;
  skip?: boolean;
  render: () => Code;
};
