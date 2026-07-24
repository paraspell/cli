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
          expect(
            file.render().toString({ format: false, path: file.path }).length,
          ).toBeGreaterThan(0);
        }
      }
    },
  );
});
