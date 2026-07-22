import { SDK_CLIENT_LABELS } from "../shared/types.js";
import type {
  ClientMetaByClient,
  GenerateAppParams,
  TemplateContext,
} from "./types.js";
import { PACKAGE_VERSIONS, SDK_VERSION } from "./versions.js";

const CLIENT_META: ClientMetaByClient = {
  papi: {
    client: "papi",
    sdkPackage: "@paraspell/sdk",
    sdkVersion: SDK_VERSION,
    clientLabel: SDK_CLIENT_LABELS.papi,
  },
  pjs: {
    client: "pjs",
    sdkPackage: "@paraspell/sdk-pjs",
    sdkVersion: SDK_VERSION,
    clientLabel: SDK_CLIENT_LABELS.pjs,
  },
  dedot: {
    client: "dedot",
    sdkPackage: "@paraspell/sdk-dedot",
    sdkVersion: SDK_VERSION,
    clientLabel: SDK_CLIENT_LABELS.dedot,
  },
};

export const createTemplateContext = ({
  kind,
  opts,
}: GenerateAppParams): TemplateContext => {
  const client = kind === "sdk" ? opts.client : "papi";
  const clientMeta = CLIENT_META[client];
  const packageManager = opts.packageManager;

  return {
    ...PACKAGE_VERSIONS,
    ...clientMeta,
    projectName: opts.name,
    packageManager,
    installCmd: `${packageManager} install`,
    devCmd: `${packageManager} run dev`,
    startCmd: `${packageManager} start`,
    framework: opts.framework,
    projectKind: kind,
    evm: opts.evm,
    swap: opts.swap,
    snowbridge: opts.snowbridge,
    evmWallet: opts.evm || opts.snowbridge,
  };
};
