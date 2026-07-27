import { describe, expect, it } from 'vitest';
import type {
  TPackageManager,
  TSdkClient,
  TSdkClientName,
} from '../shared/project-options.js';
import { createTemplateContext } from './context.js';

const clientCases: [
  TSdkClient,
  string,
  TPackageManager,
  string,
  TSdkClientName,
][] = [
  ['papi', '@paraspell/sdk', 'pnpm', 'pnpm', 'Papi'],
  ['pjs', '@paraspell/sdk-pjs', 'npm', 'npm run', 'Pjs'],
  ['dedot', '@paraspell/sdk-dedot', 'yarn', 'yarn', 'Dedot'],
];

describe('createTemplateContext', () => {
  it.each(clientCases)(
    'resolves %s metadata and %s commands',
    (client, sdkPackage, packageManager, runCommand, clientName) => {
      const context = createTemplateContext({
        kind: 'sdk',
        opts: {
          framework: 'react',
          name: 'example',
          client,
          packageManager,
          out: '/tmp/example',
          extensions: { evm: false, swap: false, snowbridge: true },
        },
      });

      expect(context).toMatchObject({
        client,
        clientName,
        sdkPackage,
        projectName: 'example',
        projectKind: 'sdk',
        installCmd: `${packageManager} install`,
        startCmd: `${runCommand} dev`,
        evmWallet: true,
      });
    },
  );

  it.each([
    [{ evm: false, swap: false, snowbridge: false }, 'Astar'],
    [{ evm: true, swap: false, snowbridge: false }, 'Moonbeam'],
    [{ evm: true, swap: false, snowbridge: true }, 'Ethereum'],
  ])('selects the default origin for %o', (extensions, expected) => {
    const context = createTemplateContext({
      kind: 'sdk',
      opts: {
        framework: 'node',
        name: 'example',
        client: 'papi',
        packageManager: 'pnpm',
        out: '/tmp/example',
        extensions,
      },
    });

    expect(context.defaultOriginChain).toBe(expected);
    expect(context.startCmd).toBe('pnpm start');
  });
});
