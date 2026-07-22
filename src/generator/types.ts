import type { Code } from "ts-poet";
import type {
  ApiGenerateOptions,
  Framework,
  PackageManager,
  ProjectType,
  SdkGenerateOptions,
  SdkClient,
} from "../shared/types.js";
import type { PackageVersions } from "./versions.js";

export const TEMPLATE_SET_IDS = [
  "xcm-api-node",
  "xcm-api-react",
  "xcm-api-vue",
  "xcm-sdk-node",
  "xcm-sdk-react",
  "xcm-sdk-vue",
] as const;

export type TemplateSetId = (typeof TEMPLATE_SET_IDS)[number];

export interface FrameworkMeta {
  templateSet: TemplateSetId;
  label: string;
  logoFile?: string;
}

export type GenerateAppParams =
  | {
      kind: "sdk";
      opts: SdkGenerateOptions;
    }
  | {
      kind: "api";
      opts: ApiGenerateOptions;
    };

export type SdkPackage =
  "@paraspell/sdk" | "@paraspell/sdk-pjs" | "@paraspell/sdk-dedot";

export interface ClientMeta {
  client: SdkClient;
  sdkPackage: SdkPackage;
  sdkVersion: string;
  clientLabel: string;
}

export type ClientMetaByClient = {
  [Client in SdkClient]: Omit<ClientMeta, "client"> & {
    client: Client;
  };
};

export type TemplateContext = PackageVersions &
  ClientMeta & {
    projectName: string;
    packageManager: PackageManager;
    installCmd: string;
    devCmd: string;
    startCmd: string;
    framework: Framework;
    projectKind: ProjectType;
    evm: boolean;
    swap: boolean;
    snowbridge: boolean;
    evmWallet: boolean;
  };

export interface TemplateFile {
  path: string;
  skip: boolean;
  render: () => Code;
}
