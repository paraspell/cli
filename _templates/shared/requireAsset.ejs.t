export const requireCurrency = <T extends { location: object }>(
  currency: T | undefined,
): T => {
  if (!currency?.location) {
    throw new Error("Currency is required.");
  }
  return currency;
};

export const requireSwapCurrencyTo = <T extends { location: object }>(
  swapEnabled: boolean | undefined,
  currencyTo: T | undefined,
): T | undefined => {
  if (!swapEnabled) {
    return undefined;
  }
  if (!currencyTo?.location) {
    throw new Error("Swap destination currency is required.");
  }
  return currencyTo;
};
