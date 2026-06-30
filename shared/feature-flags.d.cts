export function parseBool(value: unknown, defaultValue?: boolean): boolean;

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
