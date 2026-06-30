import type { FeatureFlags, Framework, SdkClient } from '../shared/types.js';
import {
  FEATURE_COMBOS,
  formatSdkExampleDir,
  SDK_CLIENTS,
} from './feature-combos.js';

export interface SdkExample extends FeatureFlags {
  dir: string;
  client: SdkClient;
}

function buildSdkExamplesForFramework(): SdkExample[] {
  return SDK_CLIENTS.flatMap((client) =>
    FEATURE_COMBOS.map((combo) => ({
      dir: formatSdkExampleDir(client, combo),
      client,
      ...combo,
    })),
  );
}

const FRAMEWORKS: Framework[] = ['react', 'vue', 'node'];

export const SDK_EXAMPLES: Record<Framework, SdkExample[]> = Object.fromEntries(
  FRAMEWORKS.map((framework) => [framework, buildSdkExamplesForFramework()]),
) as Record<Framework, SdkExample[]>;

export const SDK_VARIANTS_PER_FRAMEWORK = SDK_CLIENTS.length * FEATURE_COMBOS.length;
