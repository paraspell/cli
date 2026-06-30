---
to: src/evm.ts
skip_if: <%= (!evmWallet).toString() %>
---
import {
  Builder,
  isChainEvm,
} from "<%= sdkPackage %>";
import type { TransferParams } from "./types.js";
<%- h.includeShared('shared/node/getEvmWalletClient.ejs.t') %>

export { assertSubstrateOrigin } from "./isEvmOrigin.js";

export const submitEvmTransfer = async (
  params: TransferParams,
): Promise<string> => {
  const { from, to, recipient, amount, currencyLocation } = params;

  if (!isChainEvm(from)) {
    throw new Error(`Unsupported EVM origin: ${from}`);
  }
  if (!currencyLocation) {
    throw new Error("Currency location is required for EVM transfers.");
  }

  const walletClient = getEvmWalletClient(from);

  return await Builder()
    .from(from)
    .to(to)
    .currency({
      location: currencyLocation,
      amount,
    })
    .recipient(recipient)
    .sender(walletClient)
    .signAndSubmit();
};
