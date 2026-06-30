import type { FeatureFlags, SdkClient } from '../shared/types.js';

/** All valid feature flag combinations (EVM and Snowbridge are independent). */
export const FEATURE_COMBOS: readonly FeatureFlags[] = [
  { evm: false, swap: false, snowbridge: false },
  { evm: false, swap: true, snowbridge: false },
  { evm: false, swap: false, snowbridge: true },
  { evm: false, swap: true, snowbridge: true },
  { evm: true, swap: false, snowbridge: false },
  { evm: true, swap: true, snowbridge: false },
  { evm: true, swap: false, snowbridge: true },
  { evm: true, swap: true, snowbridge: true },
];

export const SDK_CLIENTS: readonly SdkClient[] = ['pjs', 'papi', 'dedot'];

export function formatApiExampleName(combo: FeatureFlags): string {
  if (!combo.evm && !combo.swap && !combo.snowbridge) {
    return 'base';
  }
  const parts: string[] = [];
  if (combo.evm) parts.push('evm');
  if (combo.swap) parts.push('swap');
  if (combo.snowbridge) parts.push('snowbridge');
  return parts.join('-');
}

export function formatSdkExampleDir(client: SdkClient, combo: FeatureFlags): string {
  if (!combo.evm && !combo.swap && !combo.snowbridge) {
    return client;
  }
  const parts: string[] = [client];
  if (combo.evm) {
    parts.push('evm');
    if (combo.swap) parts.push('swap');
    if (combo.snowbridge) parts.push('snowbridge');
  } else if (combo.swap) {
    parts.push('swap');
    if (combo.snowbridge) parts.push('snowbridge');
  } else if (combo.snowbridge) {
    parts.push('snowbridge');
  }
  return parts.join('-');
}
