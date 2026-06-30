export type WalletKind = "substrate" | "evm";

export type WalletKindOption = {
  value: WalletKind;
  label: string;
};

export const WALLET_KIND_OPTIONS: readonly WalletKindOption[] = [
  { value: "substrate", label: "Substrate" },
  { value: "evm", label: "EVM" },
];

export const parseWalletKind = (value: string): WalletKind => {
  const option = WALLET_KIND_OPTIONS.find((item) => item.value === value);
  if (!option) {
    throw new Error(`Unsupported wallet kind: ${value}`);
  }
  return option.value;
};

export type WalletAccountOption = {
  address: string;
  name?: string;
};

export type EvmAccountOption = {
  address: string;
  label: string;
};

export type EvmProviderOption = {
  uuid: string;
  label: string;
};

export type SubstrateWalletConnection<TSigner> = {
  address: string;
  signer: TSigner;
};

export type WalletControlsSubstrateProps = {
  extensionNames: string[];
  selectedExtensionName: string | undefined;
  accounts: WalletAccountOption[];
  selectedAddress: string | undefined;
  onConnectClick: () => void;
  onExtensionChange: (name: string) => void;
  onAccountChange: (address: string) => void;
};

export type WalletControlsEvmProps = {
  providerOptions: EvmProviderOption[];
  selectedProviderUuid: string | undefined;
  accounts: EvmAccountOption[];
  selectedAddress: string | undefined;
  onConnectClick: () => void;
  onProviderChange: (uuid: string) => void;
  onAccountChange: (address: string) => void;
  onDisconnect?: () => void;
};
