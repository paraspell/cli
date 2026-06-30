const { resolvePackageManager } = require('../../../shared/package-manager.cjs');
const {
  resolveFeatureFlags,
} = require('../../../shared/feature-flags.cjs');
const { SDK_VERSION, PACKAGE_VERSIONS } = require('../../../shared/versions.cjs');

module.exports = {
  params: ({ args, h }) => {
    const { evm, swap, snowbridge, evmWallet } = resolveFeatureFlags(args);

    const pm = resolvePackageManager(args.packageManager);

    return {
      ...args,
      ...pm,
      ...PACKAGE_VERSIONS,
      framework: 'react',
      projectKind: 'api',
      client: 'papi',
      evm,
      swap,
      snowbridge,
      evmWallet,
      sdkVersion: SDK_VERSION,
      projectName: args.name ?? 'my-xcm-api-app',
      h,
    };
  },
};
