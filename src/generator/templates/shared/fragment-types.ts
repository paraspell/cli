import type { TTemplateContext } from '../../types.js';

export type TFragmentId =
  | 'LICENSE'
  | 'api/buildApiParams'
  | 'api/consts'
  | 'api/fetchFromApi'
  | 'api/submitEvmTx'
  | 'api/submitUsingApi'
  | 'api/useApiData.react'
  | 'api/useApiData.vue'
  | 'evm/EvmWalletControls.react'
  | 'evm/EvmWalletControls.vue'
  | 'evm/WalletKindSelector.react'
  | 'evm/WalletKindSelector.vue'
  | 'evm/eip6963.ts'
  | 'evm/evmOrigins.api.frontend'
  | 'evm/evmOrigins.api.node'
  | 'evm/getViemChain'
  | 'evm/useEvmOriginChains.react'
  | 'evm/useEvmOriginChains.vue'
  | 'evm/useEvmWallet.react'
  | 'evm/useEvmWallet.vue'
  | 'evm/utils.ts'
  | 'node/getEvmWalletClient'
  | 'node/server'
  | 'node/substrate-keyring'
  | 'node/tsconfig'
  | 'papi/submitTransaction'
  | 'paraspell-side-effects'
  | 'requireAsset'
  | 'sdk/useCurrencyOptions.react'
  | 'sdk/useCurrencyOptions.vue'
  | 'spa/App.css'
  | 'spa/index.css'
  | 'spa/index.html'
  | 'spa/toError'
  | 'spa/vite-env.d'
  | 'swap/exchangeChains.api.frontend'
  | 'swap/useExchangeChains.react'
  | 'swap/useExchangeChains.vue'
  | 'types/api.frontend'
  | 'types/api.node'
  | 'types/api.shared'
  | 'types/common'
  | 'types/sdk.frontend'
  | 'types/sdk.node'
  | 'types/wallet.evm'
  | 'wallet/SubstrateWalletControls.react'
  | 'wallet/SubstrateWalletControls.vue'
  | 'wallet/WalletControls.react'
  | 'wallet/WalletControls.vue'
  | 'wallet/connectWalletAlert'
  | 'wallet/submitTransfer.sdk'
  | 'wallet/useExtensionWallet.react'
  | 'wallet/useExtensionWallet.vue'
  | 'wallet/usePapiWallet.react'
  | 'wallet/usePapiWallet.vue'
  | 'wallet/useWalletWithEvm.api.react'
  | 'wallet/useWalletWithEvm.api.vue'
  | 'wallet/useWalletWithEvm.sdk.react'
  | 'wallet/useWalletWithEvm.sdk.vue'
  | 'wallet/useWalletWithEvmCore.react'
  | 'wallet/useWalletWithEvmCore.vue'
  | 'xcm/dedot'
  | 'xcm/evmTransfer.sdk'
  | 'xcm/papi'
  | 'xcm/pjs';

export type TFragmentRenderer = (template: TFragmentId) => string;

export type TFragmentTemplates<Id extends TFragmentId = TFragmentId> = Record<
  Id,
  () => string
>;

export type TFragmentFactory<Id extends TFragmentId> = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
) => TFragmentTemplates<Id>;
