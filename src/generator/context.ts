import {
  FRAMEWORK_OPTIONS,
  packageScriptCommand,
  requiresEvmWallet,
  SDK_CLIENT_NAMES,
  SDK_CLIENT_OPTIONS,
} from '../shared/project-options.js';
import { SDK_PACKAGE_BY_CLIENT } from './config.js';
import type { TGenerateAppParams, TTemplateContext } from './types.js';
import { PACKAGE_VERSIONS, SDK_VERSION } from './versions.js';

export const createTemplateContext = ({
  kind,
  opts,
}: TGenerateAppParams): TTemplateContext => {
  const client = opts.client;
  const packageManager = opts.packageManager;

  return {
    ...PACKAGE_VERSIONS,
    client,
    clientName: SDK_CLIENT_NAMES[client],
    sdkPackage: SDK_PACKAGE_BY_CLIENT[client],
    sdkVersion: SDK_VERSION,
    clientLabel: SDK_CLIENT_OPTIONS[client].label,
    projectName: opts.name,
    packageManager,
    installCmd: `${packageManager} install`,
    startCmd: packageScriptCommand(
      packageManager,
      FRAMEWORK_OPTIONS[opts.framework].startScript,
    ),
    framework: opts.framework,
    projectKind: kind,
    extensions: opts.extensions,
    evmWallet: requiresEvmWallet(opts.extensions),
    defaultOriginChain: opts.extensions.snowbridge
      ? 'Ethereum'
      : opts.extensions.evm
        ? 'Moonbeam'
        : 'Astar',
  };
};
