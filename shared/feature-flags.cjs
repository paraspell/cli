/** @param {unknown} value @param {boolean} [defaultValue] */
function parseBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * @param {{ evm: unknown, swap: unknown, snowbridge: unknown }} input
 * @returns {{ evm: boolean, swap: boolean, snowbridge: boolean, evmWallet: boolean }}
 */
function resolveFeatureFlags(input) {
  const evm = parseBool(input.evm, false);
  const swap = parseBool(input.swap, false);
  const snowbridge = parseBool(input.snowbridge, false);
  return {
    evm,
    swap,
    snowbridge,
    evmWallet: evm || snowbridge,
  };
}

module.exports = {
  parseBool,
  resolveFeatureFlags,
};
