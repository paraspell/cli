import { describe, expect, it } from 'vitest';
import type { TPackageManager, TSdkClient } from '../shared/project-options.js';
import { createTemplateContext } from './context.js';

const clientCases: [TSdkClient, string, TPackageManager, string][] = [
  ['papi', '@paraspell/sdk', 'pnpm', 'pnpm'],
  ['pjs', '@paraspell/sdk-pjs', 'npm', 'npm run'],
  ['dedot', '@paraspell/sdk-dedot', 'yarn', 'yarn'],
];

describe('createTemplateContext', () => {
  it.each(clientCases)(
    'resolves %s metadata and %s commands',
    (client, sdkPackage, packageManager, runCommand) => {
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
        sdkPackage,
        projectName: 'example',
        projectKind: 'sdk',
        installCmd: `${packageManager} install`,
        devCmd: `${runCommand} dev`,
        evmWallet: true,
      });
    },
  );
});
