import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TWalletCoreFragmentId = Exclude<
  Extract<TFragmentId, `wallet/${string}`>,
  `wallet/${string}.react` | `wallet/${string}.vue`
>;

export const createWalletCoreFragments: TFragmentFactory<
  TWalletCoreFragmentId
> = (context) => {
  const { client, clientName } = context;

  return {
    'wallet/connectWalletAlert':
      () => source`import type { TWalletKind } from "../types";
        
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
    'wallet/useWalletWithEvm.api':
      () => source`import type { PolkadotSigner } from "polkadot-api";
        import type { TFormValues, TUseWalletReturn } from "../types";
        import { submitUsingApi } from "../utils/submitUsingApi";
        import { connectWalletAlert } from "../utils/connectWalletAlert";
        import { useEvmOriginChains } from "./useEvmOriginChains";
        import { usePapiWallet } from "./usePapiWallet";
        import { useWalletWithEvmCore } from "./useWalletWithEvmCore";

        export const useWalletWithEvm = (): TUseWalletReturn => {
          const { ensureEvmOriginChains, isEvmOrigin } = useEvmOriginChains();
          const papi = usePapiWallet();

          const core = useWalletWithEvmCore<PolkadotSigner>(papi);

          const submitTransfer = async (formValues: TFormValues) => {
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
        `,
    'wallet/useWalletWithEvm.sdk': () => {
      const signerType = client === 'papi' ? 'PolkadotSigner' : 'Signer';

      return source`${
        client === 'papi'
          ? source`import type { PolkadotSigner } from "polkadot-api";
        `
          : source`import type { Signer } from "@polkadot/api/types";
        `
      }
        import type { TFormValues, TUseWalletReturn } from "../types";
        import { submitUsingSdk } from "../utils/submitUsingSdk";
        import { connectWalletAlert } from "../utils/connectWalletAlert";
        import { use${clientName}Wallet } from "./use${clientName}Wallet";
        import { useWalletWithEvmCore } from "./useWalletWithEvmCore";

        export const useWalletWithEvm = (): TUseWalletReturn => {
          const ${client} = use${clientName}Wallet();

          const core = useWalletWithEvmCore<${signerType}>(${client});

          const submitTransfer = async (formValues: TFormValues) => {
            const options = core.buildSubmitOptions(formValues.from);
            if (!options) {
              connectWalletAlert(core);
              return false;
            }

            await submitUsingSdk(formValues, options);
            return true;
          };

          return { ...core, submitTransfer };
        };
        `;
    },
  };
};
