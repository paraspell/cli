import {
  packageRunCommand,
  SDK_CLIENT_OPTIONS,
} from '../shared/project-options.js';
import { SDK_PACKAGE_BY_CLIENT } from './config.js';
import type {
  TClientMeta,
  TGenerateAppParams,
  TTemplateContext,
} from './types.js';
import { PACKAGE_VERSIONS, SDK_VERSION } from './versions.js';

export const createTemplateContext = ({
  kind,
  opts,
}: TGenerateAppParams): TTemplateContext => {
  const client = opts.client;
  const clientMeta: TClientMeta = {
    client,
    sdkPackage: SDK_PACKAGE_BY_CLIENT[client],
    sdkVersion: SDK_VERSION,
    clientLabel: SDK_CLIENT_OPTIONS[client].label,
  };
  const packageManager = opts.packageManager;
  const runScript = packageRunCommand(packageManager);

  return {
    ...PACKAGE_VERSIONS,
    ...clientMeta,
    projectName: opts.name,
    packageManager,
    installCmd: `${packageManager} install`,
    devCmd: `${runScript} dev`,
    startCmd: `${packageManager} start`,
    framework: opts.framework,
    projectKind: kind,
    extensions: opts.extensions,
    evmWallet: opts.extensions.evm || opts.extensions.snowbridge,
  };
};
