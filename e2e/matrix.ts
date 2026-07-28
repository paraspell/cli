import {
  EXTENSION_KEYS,
  FRAMEWORKS,
  SDK_CLIENTS,
  type TExtensions,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from '../src/shared/project-options.js';

export type TGenerationCase = {
  kind: TProjectType;
  framework: TFramework;
  client?: TSdkClient;
  extensions: TExtensions;
  packageManager: TPackageManager;
  privateKey?: string;
  substrateMnemonic?: string;
};

export const EXTENSION_COMBINATIONS: TExtensions[] = [false, true].flatMap(
  (evm) =>
    [false, true].flatMap((swap) =>
      [false, true].map((snowbridge) => ({ evm, swap, snowbridge })),
    ),
);

export const caseId = (testCase: TGenerationCase): string => {
  const extensions = EXTENSION_KEYS.filter(
    (extension) => testCase.extensions[extension],
  ).join('-');

  return [
    testCase.kind,
    testCase.framework,
    testCase.client,
    extensions || 'none',
    testCase.packageManager,
  ]
    .filter(Boolean)
    .join('-');
};

const buildCases: TGenerationCase[] = [];

for (const framework of FRAMEWORKS) {
  for (const client of SDK_CLIENTS) {
    for (const extensions of EXTENSION_COMBINATIONS) {
      buildCases.push({
        kind: 'sdk',
        framework,
        client,
        extensions,
        packageManager: 'pnpm',
      });
    }
  }

  for (const extensions of EXTENSION_COMBINATIONS) {
    buildCases.push({
      kind: 'api',
      framework,
      extensions,
      packageManager: 'pnpm',
    });
  }
}

export const BUILD_CASES = buildCases;
