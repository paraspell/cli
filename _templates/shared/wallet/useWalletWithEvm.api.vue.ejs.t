import type { PolkadotSigner } from "polkadot-api";
import type { FormValues } from "../../types";
import { useEvmOriginChains } from "../../evm/useEvmOriginChains";
import { submitUsingApi } from "../../submit/submitUsingApi";
import { createWalletControls } from "../shared/createWalletControls";
import { connectWalletAlert } from "../shared/submitTransfer";
import { useWalletWithEvmCore } from "../shared/useWalletWithEvmCore";
import type { UseWalletReturn } from "../../types";
import SubstrateWalletControls from "../shared/SubstrateWalletControls.vue";
import { usePapiWallet } from "./usePapiWallet";

export const WalletControls = createWalletControls(SubstrateWalletControls);

export const useWalletWithEvm = (): UseWalletReturn => {
  const { ensureEvmOriginChains, isEvmOrigin } = useEvmOriginChains();
  const papi = usePapiWallet();

  const core = useWalletWithEvmCore<PolkadotSigner>({
    extensionNames: papi.extensionNames,
    selectedExtensionName: papi.selectedExtensionName,
    accounts: papi.accounts,
    selectedAddress: papi.selectedAddress,
    connection: papi.connection,
    discoverExtensions: papi.discoverExtensions,
    selectExtension: papi.selectExtension,
    selectAccountByAddress: papi.selectAccountByAddress,
  });

  const submitTransfer = async (formValues: FormValues) => {
    const options = core.buildSubmitOptions(formValues.from);
    if (!options) {
      connectWalletAlert(core);
      return false;
    }

    await submitUsingApi(formValues, options, {
      ensureEvmOriginChains,
      isEvmOrigin,
    });
    return true;
  };

  return { ...core, submitTransfer };
};
