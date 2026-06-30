import type { WalletKind } from "../../types";

export const connectWalletAlert = (wallet: {
  activeWalletKind: WalletKind;
}): void => {
  alert(
    wallet.activeWalletKind === "evm"
      ? "Connect EVM wallet provider first"
      : "No account selected, connect wallet first",
  );
};
