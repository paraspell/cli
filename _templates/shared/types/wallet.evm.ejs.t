export type WalletKindSelectorProps = {
  activeWalletKind: <%- framework === 'vue' ? 'Ref<WalletKind>' : 'WalletKind' %>;
  setActiveWalletKind: (kind: WalletKind) => void;
};

export type SubstrateWalletBase<TSigner> = {
  extensionNames: <%- framework === 'vue' ? 'Ref<string[]> | string[]' : 'string[]' %>;
  selectedExtensionName: <%- framework === 'vue' ? 'Ref<string | undefined> | string | undefined' : 'string | undefined' %>;
  accounts: <%- framework === 'vue' ? 'Ref<WalletAccountOption[]> | WalletAccountOption[]' : 'WalletAccountOption[]' %>;
  selectedAddress: <%- framework === 'vue' ? 'Ref<string | undefined> | string | undefined' : 'string | undefined' %>;
  connection: <%- framework === 'vue'
    ? 'Ref<SubstrateWalletConnection<TSigner> | null> | SubstrateWalletConnection<TSigner> | null'
    : 'SubstrateWalletConnection<TSigner> | null' %>;
  discoverExtensions: () => Promise<void>;
  selectExtension: (name: string) => Promise<void>;
  selectAccountByAddress: (address: string) => void;
};

export type WalletSubmitOptions<TSigner = unknown> =
  | { kind: "evm"; walletClient: WalletClient; provider: EIP1193Provider }
  | { kind: "substrate"; signer: TSigner; senderAddress: string };

export type UseWalletWithEvmReturn<TSigner = unknown> = SubstrateWalletBase<TSigner> & {
  activeWalletKind: <%- framework === 'vue' ? 'Ref<WalletKind>' : 'WalletKind' %>;
  setActiveWalletKind: (kind: WalletKind) => void;
  buildSubmitOptions: (
    from: <%- projectKind === 'sdk' ? 'TChain' : 'string' %>,
  ) => WalletSubmitOptions<TSigner> | null;
  submitTransfer: (formValues: FormValues) => Promise<boolean>;
  evmAccounts: <%- framework === 'vue' ? 'ComputedRef<EvmAccountOption[]>' : 'EvmAccountOption[]' %>;
  evmProviderOptions: <%- framework === 'vue' ? 'Ref<EvmProviderOption[]> | EvmProviderOption[]' : 'EvmProviderOption[]' %>;
  selectedEvmProviderUuid: <%- framework === 'vue' ? 'ComputedRef<string | undefined> | string | undefined' : 'string | undefined' %>;
  discoverEvmProviders: () => Promise<void>;
  selectEvmProvider: (uuid: string) => Promise<void>;
  selectEvmAccount: (address: string) => void;
  disconnectEvm: () => void;
  getEvmWalletClient: (
    origin: <%- projectKind === 'sdk' ? 'TChain' : 'string' %>,
  ) => WalletClient | undefined;
};

export type UseWalletReturn = UseWalletWithEvmReturn<<%= client === 'papi' ? 'PolkadotSigner' : 'Signer' %>>;
