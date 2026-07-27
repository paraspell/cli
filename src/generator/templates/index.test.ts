import { describe, expect, it } from 'vitest';
import {
  type TExtensions,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from '../../shared/project-options.js';
import { GENERATOR_TARGETS } from '../config.js';
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
  const templateSet = GENERATOR_TARGETS[kind][framework].templateSet;
  return new Map(
    createTemplateFiles(templateSet, context)
      .filter((file) => !file.skip)
      .map((file) => [
        file.path,
        file.render().toString({ format: false, path: file.path }),
      ]),
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
        const templateSet = GENERATOR_TARGETS[kind][framework].templateSet;
        const files = createTemplateFiles(templateSet, context).filter(
          (file) => !file.skip,
        );
        const paths = files.map((file) => file.path);

        expect(new Set(paths).size).toBe(paths.length);
        expect(paths).toContain('package.json');
        for (const file of files) {
          const output = file
            .render()
            .toString({ format: false, path: file.path });
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
    const files = createTemplateFiles('xcm-sdk-node', context).filter(
      (file) => !file.skip,
    );
    const manifestFile = files.find((file) => file.path === 'package.json');
    expect(manifestFile).toBeDefined();

    const manifest = JSON.parse(
      manifestFile!.render().toString({ format: false, path: 'package.json' }),
    ) as { dependencies: Record<string, string> };

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
    expect(apiReact.get('src/utils.ts')).not.toContain('onSign');
    expect(apiReact.get('src/utils.ts')).not.toContain('{ txHash: string }');

    const minimalPapiReact = renderTemplates(
      'sdk',
      'react',
      'papi',
      minimalExtensions,
    );
    expect(minimalPapiReact.has('src/evm/isEvmOrigin.ts')).toBe(false);
    expect(
      minimalPapiReact.get('src/wallet/papi/usePapiWallet.ts'),
    ).not.toContain('selectedExtension,');
    expect(
      minimalPapiReact.get('src/wallet/papi/usePapiWallet.ts'),
    ).not.toMatch(/return\s*\{[\s\S]*?\bselectedAccount,/);

    const fullPapiNode = renderTemplates('sdk', 'node', 'papi', fullExtensions);
    expect(fullPapiNode.has('src/isEvmOrigin.ts')).toBe(false);
    expect(fullPapiNode.get('src/evm.ts')).not.toContain('submitEvmTransfer');

    const minimalDedotNode = renderTemplates(
      'sdk',
      'node',
      'dedot',
      minimalExtensions,
    );
    expect(minimalDedotNode.has('src/isEvmOrigin.ts')).toBe(true);
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
    const files = createTemplateFiles('xcm-api-react', context).filter(
      (file) => !file.skip,
    );
    const outputByPath = new Map(
      files.map((file) => [
        file.path,
        file.render().toString({ format: false, path: file.path }),
      ]),
    );

    expect(outputByPath.get('src/App.tsx')).toContain('/paraspell.png');
    expect(outputByPath.get('index.html')).toContain('/paraspell-icon.png');
  });
});
