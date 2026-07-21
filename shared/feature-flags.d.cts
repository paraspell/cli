export function resolveFeatureFlags(input: {
  evm: unknown;
  swap: unknown;
  snowbridge: unknown;
}): {
  evm: boolean;
  swap: boolean;
  snowbridge: boolean;
  evmWallet: boolean;
};
