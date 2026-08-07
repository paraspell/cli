import { describe, expect, it } from 'vitest';
import {
  FRAMEWORKS,
  PROJECT_TYPES,
  SDK_CLIENTS,
  type TExtensions,
  type TFramework,
  type TProjectType,
  type TSdkClient,
} from '../../shared/project-options.js';
import { createTemplateContext } from '../context.js';
import { createTemplateFiles } from './index.js';

const EXTENSION_COMBINATIONS: readonly TExtensions[] = [false, true].flatMap(
  (evm) =>
    [false, true].flatMap((swap) =>
      [false, true].map((snowbridge) => ({ evm, swap, snowbridge })),
    ),
);

const renderTemplates = (
  kind: TProjectType,
  framework: TFramework,
  client: TSdkClient,
  extensions: TExtensions,
): Map<string, string> => {
  const context = createTemplateContext({
    kind,
    opts: {
      framework,
      name: `${kind}-${framework}`,
      client,
      packageManager: 'pnpm',
      out: '/tmp/not-written',
      extensions,
    },
  });
  return new Map(
    createTemplateFiles(context).map((file) => [file.path, file.render()]),
  );
};

describe('createTemplateFiles', () => {
  it('renders every supported project combination without invalid files', () => {
    let combinations = 0;

    for (const kind of PROJECT_TYPES) {
      for (const framework of FRAMEWORKS) {
        const clients = kind === 'sdk' ? SDK_CLIENTS : (['papi'] as const);

        for (const client of clients) {
          for (const extensions of EXTENSION_COMBINATIONS) {
            const caseName = [
              kind,
              framework,
              client,
              ...Object.entries(extensions)
                .filter(([, enabled]) => enabled)
                .map(([extension]) => extension),
            ].join('-');
            const context = createTemplateContext({
              kind,
              opts: {
                framework,
                name: caseName,
                client,
                packageManager: 'pnpm',
                out: '/tmp/not-written',
                extensions,
              },
            });
            const files = createTemplateFiles(context);
            const paths = files.map((file) => file.path);

            expect(new Set(paths).size, caseName).toBe(paths.length);
            for (const file of files) {
              expect(file.render(), `${caseName}:${file.path}`).not.toBe('');
            }
            combinations += 1;
          }
        }
      }
    }

    expect(combinations).toBe(96);
  });

  it('keeps minimal Node SDK manifests free of browser and extension dependencies', () => {
    const context = createTemplateContext({
      kind: 'sdk',
      opts: {
        framework: 'node',
        name: 'minimal-node-sdk',
        client: 'pjs',
        packageManager: 'pnpm',
        out: '/tmp/not-written',
        extensions: { evm: false, swap: false, snowbridge: false },
      },
    });
    const files = createTemplateFiles(context);
    const manifestFile = files.find((file) => file.path === 'package.json');
    expect(manifestFile).toBeDefined();

    const manifest = JSON.parse(manifestFile!.render()) as {
      dependencies: Record<string, string>;
    };

    expect(manifest.dependencies).toHaveProperty('@polkadot/api');
    expect(manifest.dependencies).toHaveProperty('@polkadot/types');
    expect(manifest.dependencies).toHaveProperty('@polkadot/util');
    expect(manifest.dependencies).not.toHaveProperty(
      '@polkadot/extension-dapp',
    );
    expect(manifest.dependencies).not.toHaveProperty('mipd');
    expect(manifest.dependencies).not.toHaveProperty('viem');
    expect(manifest.dependencies).not.toHaveProperty('@paraspell/swap');
  });

  it('omits configuration-specific dead output', () => {
    const minimalExtensions = {
      evm: false,
      swap: false,
      snowbridge: false,
    };
    const fullExtensions = { evm: true, swap: true, snowbridge: true };

    const apiReact = renderTemplates('api', 'react', 'papi', fullExtensions);
    expect(apiReact.has('src/evm/index.ts')).toBe(false);
    expect(apiReact.has('src/wallet/evm/index.ts')).toBe(false);
    expect(apiReact.has('src/utils.ts')).toBe(false);
    const apiPapiSubmit = apiReact.get('src/utils/submitPapiTransaction.ts');
    expect(apiPapiSubmit).toContain('tx.signAndSubmit(signer)');
    expect(apiPapiSubmit).toContain('throw new Error(message)');
    expect(apiPapiSubmit).toContain('{ cause: error }');
    expect(apiPapiSubmit).not.toContain('UnsupportedOperationError');
    expect(apiPapiSubmit).not.toContain('signSubmitAndWatch');
    expect(apiReact.get('src/utils/submitEvmTx.ts')).toContain(
      'walletClient.sendTransaction',
    );
    expect(apiReact.get('src/utils/submitEvmTx.ts')).not.toContain(
      'createPublicClient',
    );
    const apiDataHook = apiReact.get('src/hooks/useApiData.ts');
    expect(apiDataHook).toContain('state?.url === url');
    expect(apiDataHook).not.toContain('setLoading');

    const minimalPapiReact = renderTemplates(
      'sdk',
      'react',
      'papi',
      minimalExtensions,
    );
    expect(minimalPapiReact.has('src/evm/isEvmOrigin.ts')).toBe(false);
    expect(minimalPapiReact.get('src/hooks/usePapiWallet.ts')).not.toContain(
      'selectedExtension,',
    );
    expect(minimalPapiReact.get('src/hooks/usePapiWallet.ts')).not.toMatch(
      /return\s*\{[\s\S]*?\bselectedAccount,/,
    );
    expect(minimalPapiReact.get('src/utils/submitUsingSdk.ts')).toContain(
      'submitPapiTransaction(tx, signer)',
    );
    const sdkPapiSubmit = minimalPapiReact.get(
      'src/utils/submitPapiTransaction.ts',
    );
    expect(sdkPapiSubmit).toBe(apiPapiSubmit);

    const fullPapiNode = renderTemplates('sdk', 'node', 'papi', fullExtensions);
    expect(fullPapiNode.has('src/isEvmOrigin.ts')).toBe(false);
    expect(fullPapiNode.get('src/evm.ts')).not.toContain('submitEvmTransfer');

    const minimalDedotNode = renderTemplates(
      'sdk',
      'node',
      'dedot',
      minimalExtensions,
    );
    expect(minimalDedotNode.has('src/isEvmOrigin.ts')).toBe(false);
    expect(minimalDedotNode.get('src/substrate.ts')).not.toContain('signBytes');
    expect(minimalDedotNode.get('src/types.ts')).not.toContain(
      'currencyToLocation',
    );

    const minimalApiNode = renderTemplates(
      'api',
      'node',
      'papi',
      minimalExtensions,
    );
    expect(minimalApiNode.get('src/substrate.ts')).toContain(
      'export const getSubstrateMnemonic',
    );
    expect(minimalApiNode.get('src/substrate.ts')).toContain(
      'keyring.addFromUri(secret)',
    );
    expect(minimalApiNode.get('src/substrate.ts')).not.toContain(
      'addFromMnemonic',
    );
    expect(minimalApiNode.get('src/submitSubstrate.ts')).toContain(
      'submitPapiTransaction(tx, signer)',
    );
    expect(minimalApiNode.get('src/submitSubstrate.ts')).not.toContain(
      'signSubmitAndWatch',
    );
    expect(minimalApiNode.get('src/submitPapiTransaction.ts')).toBe(
      apiPapiSubmit,
    );
    expect(minimalApiNode.get('src/types.ts')).not.toContain(
      'currencyToLocation',
    );
    expect(minimalApiNode.get('src/types.ts')).not.toContain('exchange');

    expect(minimalPapiReact.get('src/types.ts')).not.toContain(
      'export type TWalletAccountOption',
    );

    const minimalPapiVue = renderTemplates(
      'sdk',
      'vue',
      'papi',
      minimalExtensions,
    );
    expect(minimalPapiVue.get('src/types.ts')).not.toContain(
      'TWalletControlsSubstrateProps',
    );
    expect(minimalPapiVue.get('src/components/TransferForm.vue')).toContain(
      'import { ref, watch } from "vue";',
    );
    const fullPapiVue = renderTemplates('sdk', 'vue', 'papi', fullExtensions);
    expect(fullPapiVue.get('src/types.ts')).not.toContain(
      'TWalletControlsEvmProps',
    );
  });

  it.each([
    ['react', 'src/hooks/useWalletWithEvm.ts'],
    ['vue', 'src/composables/useWalletWithEvm.ts'],
  ] as const)(
    'keeps generated %s SDK submission routing in one place',
    (framework, walletPath) => {
      const output = renderTemplates('sdk', framework, 'papi', {
        evm: true,
        swap: true,
        snowbridge: true,
      });
      const wallet = output.get(walletPath)!;
      const submitUsingSdk = output.get('src/utils/submitUsingSdk.ts')!;

      expect(output.has('src/utils/connectWalletAlert.ts')).toBe(true);
      expect(output.has('src/utils/submitTransfer.ts')).toBe(false);
      expect(wallet).toContain('await submitUsingSdk(formValues, options);');
      expect(wallet).not.toContain('submitEvmIfNeeded');
      expect(submitUsingSdk).toContain('isChainEvm');
      expect(submitUsingSdk).toContain('submitEvmTransferFromForm');
    },
  );

  it('renders the ParaSpell wordmark and dedicated favicon in browser apps', () => {
    const context = createTemplateContext({
      kind: 'api',
      opts: {
        framework: 'react',
        name: 'branded-api',
        client: 'papi',
        packageManager: 'pnpm',
        out: '/tmp/not-written',
        extensions: { evm: false, swap: false, snowbridge: false },
      },
    });
    const files = createTemplateFiles(context);
    const outputByPath = new Map(
      files.map((file) => [file.path, file.render()]),
    );

    expect(outputByPath.get('src/App.tsx')).toContain('/paraspell.png');
    expect(outputByPath.get('index.html')).toContain('/paraspell-icon.png');
  });

  it.each(['sdk', 'api'] as const)(
    'organizes generated React %s source into components, hooks, and utils',
    (kind) => {
      const output = renderTemplates(kind, 'react', 'dedot', {
        evm: true,
        swap: true,
        snowbridge: true,
      });
      const paths = [...output.keys()];
      const hookPaths = paths.filter((filePath) =>
        /(?:^|\/)use[A-Z][^/]*\.ts$/.test(filePath),
      );
      const componentPaths = paths.filter(
        (filePath) =>
          filePath.endsWith('.tsx') &&
          filePath !== 'src/main.tsx' &&
          filePath !== 'src/App.tsx',
      );
      const utilityPaths = paths.filter((filePath) =>
        filePath.startsWith('src/utils/'),
      );

      expect(hookPaths.length).toBeGreaterThan(0);
      expect(
        hookPaths.every((filePath) => /^src\/hooks\/[^/]+$/.test(filePath)),
      ).toBe(true);
      expect(componentPaths.length).toBeGreaterThan(0);
      expect(
        componentPaths.every((filePath) =>
          /^src\/components(?:\/common)?\/[^/]+\.tsx$/.test(filePath),
        ),
      ).toBe(true);
      expect(utilityPaths.length).toBeGreaterThan(0);
      expect(
        utilityPaths.every((filePath) => /^src\/utils\/[^/]+$/.test(filePath)),
      ).toBe(true);
      expect(output.has('src/components/index.ts')).toBe(false);
      expect(output.has('src/hooks/index.ts')).toBe(false);
      expect(output.has('src/components/TransferForm.tsx')).toBe(true);
      expect(output.has('src/components/XcmTransferForm.tsx')).toBe(false);
      expect(output.get('src/main.tsx')).toContain('from "./App.tsx"');
      expect(output.get('src/App.tsx')).toContain(
        'from "./components/XcmTransfer"',
      );
      expect(output.get('src/components/XcmTransfer.tsx')).toContain(
        'from "../hooks/useWalletWithEvm"',
      );
      if (kind === 'sdk') {
        expect(output.get('src/components/XcmTransfer.tsx')).toContain(
          'const wallet = useWalletWithEvm();',
        );
      }
    },
  );

  it.each(['sdk', 'api'] as const)(
    'organizes generated Vue %s source into components, composables, and utils',
    (kind) => {
      const output = renderTemplates(kind, 'vue', 'dedot', {
        evm: true,
        swap: true,
        snowbridge: true,
      });
      const paths = [...output.keys()];
      const composablePaths = paths.filter((filePath) =>
        /(?:^|\/)use[A-Z][^/]*\.ts$/.test(filePath),
      );
      const componentPaths = paths.filter(
        (filePath) => filePath.endsWith('.vue') && filePath !== 'src/App.vue',
      );
      const utilityPaths = paths.filter((filePath) =>
        filePath.startsWith('src/utils/'),
      );

      expect(composablePaths.length).toBeGreaterThan(0);
      expect(
        composablePaths.every((filePath) =>
          /^src\/composables\/[^/]+$/.test(filePath),
        ),
      ).toBe(true);
      expect(componentPaths.length).toBeGreaterThan(0);
      expect(
        componentPaths.every((filePath) =>
          /^src\/components(?:\/common)?\/[^/]+\.vue$/.test(filePath),
        ),
      ).toBe(true);
      expect(utilityPaths.length).toBeGreaterThan(0);
      expect(
        utilityPaths.every((filePath) => /^src\/utils\/[^/]+$/.test(filePath)),
      ).toBe(true);
      expect(output.has('src/components/index.ts')).toBe(false);
      expect(output.has('src/composables/index.ts')).toBe(false);
      expect(output.has('src/components/TransferForm.vue')).toBe(true);
      expect(output.has('src/components/XcmTransferForm.vue')).toBe(false);
      expect(output.get('src/App.vue')).toContain(
        'from "./components/XcmTransfer.vue"',
      );
      expect(output.get('src/components/XcmTransfer.vue')).toContain(
        'from "../composables/useWalletWithEvm"',
      );
      const transferForm = output.get('src/components/TransferForm.vue')!;
      expect(transferForm).toContain('const handleSubmit = () => {');
      expect(transferForm).toContain('<form @submit.prevent="handleSubmit">');
      if (kind === 'sdk') {
        expect(transferForm).toContain(
          'useCurrencyOptions(originChain, destinationChain, swapEnabled, exchange)',
        );
        expect(transferForm).not.toContain('const from = computed');
        expect(transferForm).not.toContain('const to = computed');
      }
      const transferComponent = output.get('src/components/XcmTransfer.vue')!;
      expect(transferComponent.indexOf('v-model:origin-chain')).toBeLessThan(
        transferComponent.indexOf(':loading'),
      );
    },
  );

  it.each(['sdk', 'api'] as const)(
    'keeps generated Node %s source compact and flat',
    (kind) => {
      const output = renderTemplates(kind, 'node', 'dedot', {
        evm: true,
        swap: true,
        snowbridge: true,
      });
      const sourcePaths = [...output.keys()].filter((filePath) =>
        filePath.startsWith('src/'),
      );

      expect(sourcePaths.length).toBeGreaterThan(0);
      expect(
        sourcePaths.every((filePath) => /^src\/[^/]+\.ts$/.test(filePath)),
      ).toBe(true);
    },
  );
});
