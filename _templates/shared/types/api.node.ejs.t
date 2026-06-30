<%- h.includeShared('shared/types/api.shared.ejs.t') %>

export type TransferParams = {
  from: string;
  to: string;
  amount: string;
  currencyLocation?: object;
  recipient: string;
  currencyToLocation?: object;
  exchange?: string[];
};
