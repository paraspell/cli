const { resolvePackageManager } = require('../../../shared/package-manager.cjs');
const {
  resolveFeatureFlags,
} = require('../../../shared/feature-flags.cjs');
const { SDK_VERSION, PACKAGE_VERSIONS } = require('../../../shared/versions.cjs');

const CLIENT_META = {
  papi: {
    client: 'papi',
    clientDir: 'papi',
    sdkPackage: '@paraspell/sdk',
    sdkVersion: SDK_VERSION,
    clientLabel: 'Polkadot API',
  },
  pjs: {
    client: 'pjs',
    clientDir: 'pjs',
    sdkPackage: '@paraspell/sdk-pjs',
    sdkVersion: SDK_VERSION,
    clientLabel: 'Polkadot JS',
  },
  dedot: {
    client: 'dedot',
    clientDir: 'dedot',
    sdkPackage: '@paraspell/sdk-dedot',
    sdkVersion: SDK_VERSION,
    clientLabel: 'Dedot',
  },
};

const CLIENT_ALIASES = {
  'polkadot-api': 'papi',
  'polkadot-js': 'pjs',
  dedot: 'dedot',
  papi: 'papi',
  pjs: 'pjs',
};

module.exports = {
  params: ({ args, h }) => {
    const rawClient = args.client ?? 'pjs';
    const clientKey = CLIENT_ALIASES[rawClient] ?? 'pjs';
    const meta = CLIENT_META[clientKey];

    const { evm, swap, snowbridge, evmWallet } = resolveFeatureFlags(args);

    const pm = resolvePackageManager(args.packageManager);

    return {
      ...args,
      ...meta,
      ...pm,
      ...PACKAGE_VERSIONS,
      framework: 'react',
      projectKind: 'sdk',
      clientKey,
      evm,
      swap,
      snowbridge,
      evmWallet,
      projectName: args.name ?? 'my-xcm-app',
      h,
    };
  },
};
