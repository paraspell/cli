import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXTENSION_COMBINATIONS,
  apiExampleName,
  sdkExampleDir,
} from '../generate-examples.js';
import {
  FRAMEWORKS,
  SDK_CLIENTS,
  type TExtensions,
  type TFramework,
  type TProjectType,
  type TSdkClient,
} from '../shared/project-options.js';

export interface TGeneratedVariant {
  id: string;
  kind: TProjectType;
  framework: TFramework;
  dir: string;
  absPath: string;
  client?: TSdkClient;
  extensions: TExtensions;
}

const cliRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

export const listVariants = (): TGeneratedVariant[] => {
  const variants: TGeneratedVariant[] = [];

  for (const framework of FRAMEWORKS) {
    for (const client of SDK_CLIENTS) {
      for (const extensions of EXTENSION_COMBINATIONS) {
        const dir = sdkExampleDir(client, extensions);
        variants.push({
          id: `sdk/${framework}/${dir}`,
          kind: 'sdk',
          framework,
          dir,
          absPath: path.join(cliRoot, 'generated', 'xcm-sdk', framework, dir),
          client,
          extensions,
        });
      }
    }
  }

  for (const framework of FRAMEWORKS) {
    for (const extensions of EXTENSION_COMBINATIONS) {
      const dir = apiExampleName(extensions);
      variants.push({
        id: `api/${framework}/${dir}`,
        kind: 'api',
        framework,
        dir,
        absPath: path.join(cliRoot, 'generated', 'xcm-api', framework, dir),
        extensions,
      });
    }
  }

  return variants;
};
