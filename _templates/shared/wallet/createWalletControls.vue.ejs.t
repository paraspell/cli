import { defineComponent, h, unref, type Component } from "vue";
import EvmWalletControls from "../evm/EvmWalletControls.vue";
import type {
  UseWalletWithEvmReturn,
  WalletControlsSubstrateProps,
} from "../../types";

export const createWalletControls = (SubstrateControls: Component) =>
  defineComponent(
    (props: { wallet: UseWalletWithEvmReturn }) => {
      return () => {
        const wallet = props.wallet;
        if (unref(wallet.activeWalletKind) === "evm") {
          return h(EvmWalletControls, {
            providerOptions: unref(wallet.evmProviderOptions),
            selectedProviderUuid: unref(wallet.selectedEvmProviderUuid),
            accounts: unref(wallet.evmAccounts),
            selectedAddress: unref(wallet.selectedAddress),
            onConnectClick: () => {
              void wallet.discoverEvmProviders();
            },
            onProviderChange: (uuid: string) => {
              void wallet.selectEvmProvider(uuid);
            },
            onAccountChange: wallet.selectEvmAccount,
            onDisconnect: wallet.disconnectEvm,
          });
        }

        const substrateProps: WalletControlsSubstrateProps = {
          extensionNames: unref(wallet.extensionNames),
          selectedExtensionName: unref(wallet.selectedExtensionName),
          accounts: unref(wallet.accounts),
          selectedAddress: unref(wallet.selectedAddress),
          onConnectClick: () => {
            void wallet.discoverExtensions();
          },
          onExtensionChange: (name: string) => {
            void wallet.selectExtension(name);
          },
          onAccountChange: wallet.selectAccountByAddress,
        };

        return h(SubstrateControls, substrateProps);
      };
    },
    {
      name: "WalletControls",
      props: {
        wallet: {
          type: Object,
          required: true,
        },
      },
    },
  );
