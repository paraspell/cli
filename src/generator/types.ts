import type { Code } from 'ts-poet';
import type {
  TApiGenerateOptions,
  TExtensions,
  TFramework,
  TPackageManager,
  TProjectType,
  TSdkClient,
  TSdkGenerateOptions,
} from '../shared/types.js';
import type { TPackageVersions } from './versions.js';

export const TEMPLATE_SET_IDS = [
  'xcm-api-node',
  'xcm-api-react',
  'xcm-api-vue',
  'xcm-sdk-node',
  'xcm-sdk-react',
  'xcm-sdk-vue',
] as const;

export type TTemplateSetId = (typeof TEMPLATE_SET_IDS)[number];

export interface TFrameworkMeta {
  templateSet: TTemplateSetId;
  label: string;
  logoFile?: string;
}

export type TGenerateAppParams =
  | {
      kind: 'sdk';
      opts: TSdkGenerateOptions;
    }
  | {
      kind: 'api';
      opts: TApiGenerateOptions;
    };

export type TSdkPackage =
  '@paraspell/sdk' | '@paraspell/sdk-pjs' | '@paraspell/sdk-dedot';

export interface TClientMeta {
  client: TSdkClient;
  sdkPackage: TSdkPackage;
  sdkVersion: string;
  clientLabel: string;
}

export type TClientMetaByClient = {
  [Client in TSdkClient]: Omit<TClientMeta, 'client'> & {
    client: Client;
  };
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

export interface TTemplateFile {
  path: string;
  skip: boolean;
  render: () => Code;
}
