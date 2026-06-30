import {
  Builder,
  createChainClient,
  type TDedotExtrinsic,<% if (swap || evmWallet) { %>
  UnsupportedOperationError,<% } %><% if (evmWallet) { %>
  isChainEvm,<% } %>
} from "@paraspell/sdk-dedot";
import type { Signer } from "@polkadot/api/types";
import type { FormValues<% if (evmWallet) { %>, WalletSubmitOptions<% } %> } from "../types";
import { requireCurrency<% if (swap) { %>, requireSwapCurrencyTo<% } %> } from "../requireAsset";
import { assertSubstrateOrigin } from "../evm/isEvmOrigin";<% if (evmWallet) { %>
import { submitEvmTransferFromForm } from "./evmTransfer";
<% } -%>

export const buildTransactions = async (
  formValues: FormValues,
  senderAddress: string,
): Promise<TDedotExtrinsic[]> => {
  const { from, to, recipient, amount<% if (swap) { %>, swapEnabled, currencyTo, exchange<% } %> } =
    formValues;

  assertSubstrateOrigin(from);
  const currency = requireCurrency(formValues.currency);

<% if (swap) { %>  if (swapEnabled) {
    const resolvedCurrencyTo = requireSwapCurrencyTo(swapEnabled, currencyTo);
    if (!resolvedCurrencyTo) {
      throw new UnsupportedOperationError("Swap destination currency is required.");
    }
    const contexts = await Builder()
      .from(from)
      .to(to)
      .currency({ location: currency.location, amount })
      .recipient(recipient)
      .swap({
        currencyTo: { location: resolvedCurrencyTo.location },
        ...(exchange?.length ? { exchange } : {}),
      })
      .sender(senderAddress)
      .buildAll();

    return contexts.map((ctx) => ctx.tx);
  }

<% } %>  const client = await createChainClient(from);
  const tx = await Builder(client)
    .from(from)
    .to(to)
    .currency({ location: currency.location, amount })
    .recipient(recipient)
    .sender(senderAddress)
    .build();

  return [tx];
};

const submitTransaction = async (
  tx: TDedotExtrinsic,
  senderAddress: string,
  signer: Signer,
): Promise<void> => {
  await tx.signAndSend(senderAddress, { signer }).untilFinalized();
};

export const submitUsingSdk = async (
  formValues: FormValues,
  <% if (evmWallet) { %>options: WalletSubmitOptions<Signer>,<% } else { %>signer: Signer,
  senderAddress: string,<% } %>
): Promise<void> => {
<% if (evmWallet) { %>  if (isChainEvm(formValues.from)) {
    if (options.kind !== "evm") {
      throw new UnsupportedOperationError(
        "EVM origin requires a connected EVM wallet.",
      );
    }

    await submitEvmTransferFromForm(
      formValues,
      options.walletClient,
      options.provider,
    );
    return;
  }

  if (options.kind !== "substrate") {
    throw new UnsupportedOperationError(
      "Substrate origin requires a Polkadot extension wallet.",
    );
  }

  const { signer, senderAddress } = options;

<% } %>  if (!senderAddress) {
    alert("No account selected, connect wallet first");
    return;
  }

  const txs = await buildTransactions(formValues, senderAddress);

  for (const tx of txs) {
    await submitTransaction(tx, senderAddress, signer);
  }
};
