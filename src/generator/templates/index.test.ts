import { describe, expect, it } from 'vitest';
import {
  type TExtensions,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from '../../shared/project-options.js';
import { createTemplateContext } from '../context.js';
import { createTemplateFiles } from './index.js';

type TTemplateCase = [
  kind: TProjectType,
  framework: TFramework,
  client: TSdkClient,
  packageManager: TPackageManager,
  extensions?: TExtensions[],
];

const templateCases: TTemplateCase[] = [
  ['sdk', 'react', 'papi', 'pnpm'],
  ['sdk', 'vue', 'pjs', 'npm'],
  [
    'sdk',
    'vue',
    'papi',
    'pnpm',
    [{ evm: false, swap: false, snowbridge: false }],
  ],
  ['sdk', 'node', 'dedot', 'yarn'],
  ['api', 'react', 'pjs', 'yarn'],
  ['api', 'vue', 'dedot', 'pnpm'],
  ['api', 'node', 'papi', 'npm'],
];

const extensionSets: TExtensions[] = [
  { evm: false, swap: false, snowbridge: false },
  { evm: true, swap: false, snowbridge: false },
  { evm: false, swap: true, snowbridge: false },
  { evm: false, swap: false, snowbridge: true },
  { evm: true, swap: true, snowbridge: true },
];

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
  it.each(templateCases)(
    'renders the %s %s templates',
    (kind, framework, client, packageManager, caseExtensions) => {
      for (const extensions of caseExtensions ?? extensionSets) {
        const context = createTemplateContext({
          kind,
          opts: {
            framework,
            name: `${kind}-${framework}`,
            client,
            packageManager,
            out: '/tmp/not-written',
            extensions,
          },
        });
        const files = createTemplateFiles(context);
        const paths = files.map((file) => file.path);

        expect(new Set(paths).size).toBe(paths.length);
        expect(paths).toContain('package.json');
        for (const file of files) {
          const output = file.render();
          expect(output.length).toBeGreaterThan(0);
        }
      }
    },
  );

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

  it.each([
    ['react', 'src/main.tsx'],
    ['vue', 'src/main.ts'],
  ] as const)(
    'shares the %s entrypoint across SDK and API templates',
    (framework, mainPath) => {
      const extensions = {
        evm: false,
        swap: false,
        snowbridge: false,
      };
      const sdk = renderTemplates('sdk', framework, 'papi', extensions);
      const api = renderTemplates('api', framework, 'papi', extensions);

      expect(sdk.get(mainPath)).toBe(api.get(mainPath));
    },
  );

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
    const apiPapiSubmit = apiReact.get('src/submit/submitPapiTransaction.ts');
    expect(apiPapiSubmit).toContain('tx.signAndSubmit(signer)');
    expect(apiPapiSubmit).toContain('throw new Error(message)');
    expect(apiPapiSubmit).not.toContain('UnsupportedOperationError');
    expect(apiPapiSubmit).not.toContain('signSubmitAndWatch');
    expect(apiReact.get('src/submit/submitEvmTx.ts')).toContain(
      'walletClient.sendTransaction',
    );
    expect(apiReact.get('src/submit/submitEvmTx.ts')).not.toContain(
      'createPublicClient',
    );

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
    expect(minimalPapiReact.get('src/xcm/papi.ts')).toContain(
      'submitPapiTransaction(tx, signer)',
    );
    const sdkPapiSubmit = minimalPapiReact.get(
      'src/xcm/submitPapiTransaction.ts',
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
    const fullPapiVue = renderTemplates('sdk', 'vue', 'papi', fullExtensions);
    expect(fullPapiVue.get('src/types.ts')).not.toContain(
      'TWalletControlsEvmProps',
    );
  });

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
    'organizes generated React %s hooks and components behind folder barrels',
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
      expect(
        paths.some((filePath) => filePath.startsWith('src/components/common/')),
      ).toBe(false);
      expect(output.get('src/components/index.ts')).toContain(
        'export { XcmTransfer }',
      );
      expect(output.has('src/components/TransferForm.tsx')).toBe(true);
      expect(output.has('src/components/XcmTransferForm.tsx')).toBe(false);
      expect(output.get('src/hooks/index.ts')).toContain(
        'export { useWalletWithEvm }',
      );
      expect(output.get('src/main.tsx')).toContain('from "./App.tsx"');
      expect(output.get('src/App.tsx')).toContain('from "./components"');
      expect(output.get('src/components/XcmTransfer.tsx')).toContain(
        'from "../hooks"',
      );
      if (kind === 'sdk') {
        expect(output.get('src/components/XcmTransfer.tsx')).toContain(
          'const wallet = useWalletWithEvm();',
        );
      }
    },
  );

  it.each(['sdk', 'api'] as const)(
    'organizes generated Vue %s composables and components conventionally',
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
      expect(
        paths.some((filePath) => filePath.startsWith('src/components/common/')),
      ).toBe(false);
      expect(output.get('src/composables/index.ts')).toContain(
        'export { useWalletWithEvm }',
      );
      expect(output.get('src/components/index.ts')).toContain(
        'export { default as XcmTransfer }',
      );
      expect(output.has('src/components/TransferForm.vue')).toBe(true);
      expect(output.has('src/components/XcmTransferForm.vue')).toBe(false);
      expect(output.get('src/App.vue')).toContain('from "./components"');
      expect(output.get('src/components/XcmTransfer.vue')).toContain(
        'from "../composables"',
      );
    },
  );
});
