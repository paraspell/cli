const buildApiParams = (
  from: string | undefined,
  to: string | undefined,
  recipient: string,
  sender: string,
  amount: string,
  currencyLocation: object,<% if (swap) { %>
  currencyToLocation?: object,
  exchange?: string[],<% } %>
): ApiParams => ({
  from,
  to,
  recipient,
  sender,
  currency: {
    location: currencyLocation,
    amount,
  },<% if (swap) { %>
  ...(currencyToLocation
    ? {
        swapOptions: {
          currencyTo: { location: currencyToLocation },
          ...(exchange?.length ? { exchange } : {}),
        },
      }
    : {}),<% } %>
});
