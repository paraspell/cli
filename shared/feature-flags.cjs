/** @param {unknown} value */
const isEnabled = (value) =>
  value === true || value === "true" || value === "1" || value === "yes";

/**
 * @param {{ evm: unknown, swap: unknown, snowbridge: unknown }} input
 * @returns {{ evm: boolean, swap: boolean, snowbridge: boolean, evmWallet: boolean }}
 */
const resolveFeatureFlags = (input) => {
  const evm = isEnabled(input.evm);
  const swap = isEnabled(input.swap);
  const snowbridge = isEnabled(input.snowbridge);
  return {
    evm,
    swap,
    snowbridge,
    evmWallet: evm || snowbridge,
  };
};

module.exports = {
  resolveFeatureFlags,
};
