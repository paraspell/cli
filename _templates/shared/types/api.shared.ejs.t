export type AssetInfo = {
  symbol?: string;
  assetId?: string;
  location: object;
};

export type ApiParams = {
  from?: string;
  to?: string;
  currency: { location: object; amount: string };
  recipient: string;
  sender: string;<% if (swap) { %>
  swapOptions?: {
    currencyTo: { location: object };
    exchange?: string[];
  };<% } %>
};

export type ApiTransaction = {
  type: string;
  chain: string;
  tx: string;
};

export type ApiErrorResponse = {
  message?: string;
};
