import type { FragmentFactory, FragmentId } from "./contracts.js";
import { source } from "../source.js";

type WalletCoreFragmentId = Exclude<
  Extract<FragmentId, `wallet/${string}`>,
  `wallet/${string}.react` | `wallet/${string}.vue`
>;

export const createWalletCoreFragments: FragmentFactory<
  WalletCoreFragmentId
> = (_context, renderFragment) => {
  return {
    "wallet/connectWalletAlert":
      () => source`import type { WalletKind } from "../../types";
        
        export const connectWalletAlert = (wallet: {
          activeWalletKind: WalletKind;
        }): void => {
          alert(
            wallet.activeWalletKind === "evm"
              ? "Connect EVM wallet provider first"
              : "No account selected, connect wallet first",
          );
        };
        `,
    "wallet/submitTransfer.sdk":
      () => source`${renderFragment("wallet/connectWalletAlert")}
        
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
        `,
  };
};
