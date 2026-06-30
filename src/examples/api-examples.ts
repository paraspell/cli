import type { FeatureFlags } from '../shared/types.js';
import { FEATURE_COMBOS, formatApiExampleName } from './feature-combos.js';

export interface ApiExample extends FeatureFlags {
  name: string;
}

export const API_EXAMPLES: ApiExample[] = FEATURE_COMBOS.map((combo) => ({
  name: formatApiExampleName(combo),
  ...combo,
}));

export const API_VARIANTS_PER_FRAMEWORK = FEATURE_COMBOS.length;
