import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TWalletCoreFragmentId = Exclude<
  Extract<TFragmentId, `wallet/${string}`>,
  `wallet/${string}.react` | `wallet/${string}.vue`
>;

export const createWalletCoreFragments: TFragmentFactory<
  TWalletCoreFragmentId
> = (_context, renderFragment) => {
  return {
    'wallet/connectWalletAlert':
      () => source`import type { TWalletKind } from "../../types";
        
        export const connectWalletAlert = (wallet: {
          activeWalletKind: TWalletKind;
        }): void => {
          alert(
            wallet.activeWalletKind === "evm"
              ? "Connect EVM wallet provider first"
              : "No account selected, connect wallet first",
          );
        };
        `,
    'wallet/submitTransfer.sdk':
      () => source`${renderFragment('wallet/connectWalletAlert')}
        
        import type { TFormValues } from "../../types";
        import { submitEvmTransferFromForm } from "../../xcm/evmTransfer";
        import type { TWalletSubmitOptions } from "../../types";
        
        export const submitEvmIfNeeded = async (
          formValues: TFormValues,
          options: TWalletSubmitOptions,
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
