<%- h.includeShared('shared/wallet/connectWalletAlert.ejs.t') %>

import type { FormValues } from "../../types";
import { submitEvmTransferFromForm } from "../../xcm/evmTransfer";
import type { WalletSubmitOptions } from "../../types";

export const submitEvmIfNeeded = async (
  formValues: FormValues,
  options: WalletSubmitOptions,
): Promise<boolean> => {
  if (options.kind !== "evm") return false;
  await submitEvmTransferFromForm(
    formValues,
    options.walletClient,
    options.provider,
  );
  return true;
};
