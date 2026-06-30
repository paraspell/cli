import type { FC } from "react";
import { EvmWalletControls } from "../evm/EvmWalletControls";
import type {
  UseWalletWithEvmReturn,
  WalletControlsSubstrateProps,
} from "../../types";

export const createWalletControls = (
  SubstrateControls: FC<WalletControlsSubstrateProps>,
) => {
  const WalletControls: FC<{ wallet: UseWalletWithEvmReturn }> = ({
    wallet,
  }) => {
    if (wallet.activeWalletKind === "evm") {
      return (
        <EvmWalletControls
          providerOptions={wallet.evmProviderOptions}
          selectedProviderUuid={wallet.selectedEvmProviderUuid}
          accounts={wallet.evmAccounts}
          selectedAddress={wallet.selectedAddress}
          onConnectClick={() => {
            void wallet.discoverEvmProviders();
          }}
          onProviderChange={(uuid) => {
            void wallet.selectEvmProvider(uuid);
          }}
          onAccountChange={wallet.selectEvmAccount}
          onDisconnect={wallet.disconnectEvm}
        />
      );
    }

    return (
      <SubstrateControls
        extensionNames={wallet.extensionNames}
        selectedExtensionName={wallet.selectedExtensionName}
        accounts={wallet.accounts}
        selectedAddress={wallet.selectedAddress}
        onConnectClick={() => {
          void wallet.discoverExtensions();
        }}
        onExtensionChange={(name) => {
          void wallet.selectExtension(name);
        }}
        onAccountChange={wallet.selectAccountByAddress}
      />
    );
  };

  return WalletControls;
};
