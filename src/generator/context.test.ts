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

  it('selects the Node start command', () => {
    const context = createTemplateContext({
      kind: 'sdk',
      opts: {
        framework: 'node',
        name: 'example',
        client: 'papi',
        packageManager: 'pnpm',
        out: '/tmp/example',
        extensions: { evm: false, swap: false, snowbridge: false },
      },
    });

    expect(context.startCmd).toBe('pnpm start');
  });
});
