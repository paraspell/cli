import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEATURE_COMBOS,
  apiExampleName,
  sdkExampleDir,
} from '../generate-examples.js';
import { FRAMEWORKS, SDK_CLIENTS } from '../shared/types.js';
import type {
  FeatureFlags,
  Framework,
  ProjectType,
  SdkClient,
} from '../shared/types.js';

export interface GeneratedVariant extends FeatureFlags {
  id: string;
  kind: ProjectType;
  framework: Framework;
  dir: string;
  absPath: string;
  client?: SdkClient;
}

const cliRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const listVariants = (): GeneratedVariant[] => {
  const variants: GeneratedVariant[] = [];

  for (const framework of FRAMEWORKS) {
    for (const client of SDK_CLIENTS) {
      for (const combo of FEATURE_COMBOS) {
        const dir = sdkExampleDir(client, combo);
        variants.push({
          id: `sdk/${framework}/${dir}`,
          kind: 'sdk',
          framework,
          dir,
          absPath: path.join(cliRoot, 'generated', 'xcm-sdk', framework, dir),
          client,
          evm: combo.evm,
          swap: combo.swap,
          snowbridge: combo.snowbridge,
        });
      }
    }
  }

  for (const framework of FRAMEWORKS) {
    for (const combo of FEATURE_COMBOS) {
      const dir = apiExampleName(combo);
      variants.push({
        id: `api/${framework}/${dir}`,
        kind: 'api',
        framework,
        dir,
        absPath: path.join(cliRoot, 'generated', 'xcm-api', framework, dir),
        evm: combo.evm,
        swap: combo.swap,
        snowbridge: combo.snowbridge,
      });
    }
  }

  return variants;
}
