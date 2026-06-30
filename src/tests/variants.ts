import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_EXAMPLES } from '../examples/api-examples.js';
import { SDK_EXAMPLES } from '../examples/sdk-examples.js';
import type { FeatureFlags, Framework, SdkClient } from '../shared/types.js';

export type VariantKind = 'sdk' | 'api';

export interface GeneratedVariant extends FeatureFlags {
  id: string;
  kind: VariantKind;
  framework: Framework;
  dir: string;
  absPath: string;
  client?: SdkClient;
}

const cliRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function listVariants(options?: {
  kind?: VariantKind;
  framework?: Framework;
}): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];

  if (!options?.kind || options.kind === 'sdk') {
    for (const framework of Object.keys(SDK_EXAMPLES) as Framework[]) {
      if (options?.framework && options.framework !== framework) continue;
      for (const ex of SDK_EXAMPLES[framework]) {
        variants.push({
          id: `sdk/${framework}/${ex.dir}`,
          kind: 'sdk',
          framework,
          dir: ex.dir,
          absPath: path.join(cliRoot, 'generated', 'xcm-sdk', framework, ex.dir),
          client: ex.client,
          evm: ex.evm,
          swap: ex.swap,
          snowbridge: ex.snowbridge,
        });
      }
    }
  }

  if (!options?.kind || options.kind === 'api') {
    for (const framework of ['react', 'vue', 'node'] as Framework[]) {
      if (options?.framework && options.framework !== framework) continue;
      for (const ex of API_EXAMPLES) {
        variants.push({
          id: `api/${framework}/${ex.name}`,
          kind: 'api',
          framework,
          dir: ex.name,
          absPath: path.join(cliRoot, 'generated', 'xcm-api', framework, ex.name),
          evm: ex.evm,
          swap: ex.swap,
          snowbridge: ex.snowbridge,
        });
      }
    }
  }

  return variants;
}
