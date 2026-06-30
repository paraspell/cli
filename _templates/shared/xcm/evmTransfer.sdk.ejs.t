import { Builder, isChainEvm } from "<%= sdkPackage %>";<% if (swap) { %>
import "@paraspell/swap";<% } %>
import type { WalletClient } from "viem";
import type { EIP1193Provider } from "mipd";
import type { FormValues } from "../types";
import { requireCurrency<% if (swap) { %>, requireSwapCurrencyTo<% } %> } from "../requireAsset";
import { ensureEvmWalletClient } from "../evm";

export const submitEvmTransferFromForm = async (
  formValues: FormValues,
  walletClient: WalletClient,
  provider: EIP1193Provider,
): Promise<void> => {
  const { from, to, recipient, amount<% if (swap) { %>, swapEnabled, currencyTo, exchange<% } %> } =
    formValues;

  if (!isChainEvm(from)) {
    throw new Error(`Unsupported EVM origin: ${from}`);
  }

  const currency = requireCurrency(formValues.currency);
  const signer = await ensureEvmWalletClient(walletClient, from, provider);

<% if (swap) { %>  if (swapEnabled) {
    const resolvedCurrencyTo = requireSwapCurrencyTo(swapEnabled, currencyTo);
    if (!resolvedCurrencyTo) {
      throw new Error("Swap destination currency is required.");
    }
    const builder = Builder()
      .from(from)
      .to(to)
      .currency({ location: currency.location, amount })
      .recipient(recipient)
      .sender(signer)
      .swap({
        currencyTo: { location: resolvedCurrencyTo.location },
        ...(exchange?.length ? { exchange } : {}),
      });

    await builder.signAndSubmitAll();
    return;
  }

<% } %>  await Builder()
    .from(from)
    .to(to)
    .currency({ location: currency.location, amount })
    .recipient(recipient)
    .sender(signer)
    .signAndSubmit();
};
