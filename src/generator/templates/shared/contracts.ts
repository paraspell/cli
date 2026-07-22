import type { Code } from "ts-poet";
import type { TemplateContext } from "../../types.js";

export type FragmentId =
  | "LICENSE"
  | "api/buildApiParams"
  | "api/consts"
  | "api/fetchFromApi"
  | "api/submitEvmTx"
  | "api/submitUsingApi"
  | "api/utils"
  | "evm/EvmWalletControls.react"
  | "evm/EvmWalletControls.vue"
  | "evm/WalletKindSelector.react"
  | "evm/WalletKindSelector.vue"
  | "evm/eip6963.ts"
  | "evm/evmOrigins.api.frontend"
  | "evm/evmOrigins.api.node"
  | "evm/evmWalletClient"
  | "evm/getViemChain"
  | "evm/index.api"
  | "evm/index.sdk"
  | "evm/isEvmOrigin.sdk"
  | "evm/useEvmOriginChains.react"
  | "evm/useEvmOriginChains.vue"
  | "evm/useEvmWallet.react"
  | "evm/useEvmWallet.vue"
  | "evm/utils.ts"
  | "node/getEvmSenderAddress"
  | "node/getEvmWalletClient"
  | "node/substrate-keyring"
  | "paraspell-side-effects"
  | "requireAsset"
  | "sdk/useCurrencyOptions.react"
  | "sdk/useCurrencyOptions.vue"
  | "spa/App.css"
  | "spa/index.css"
  | "spa/index.html"
  | "spa/toError"
  | "spa/vite-env.d"
  | "swap/exchangeChains.api.frontend"
  | "swap/index.api"
  | "swap/useExchangeChains.react"
  | "swap/useExchangeChains.vue"
  | "types/api.frontend"
  | "types/api.node"
  | "types/api.shared"
  | "types/common"
  | "types/sdk.frontend"
  | "types/sdk.node"
  | "types/wallet.evm"
  | "wallet/SubstrateWalletControls.react"
  | "wallet/SubstrateWalletControls.vue"
  | "wallet/connectWalletAlert"
  | "wallet/createWalletControls.react"
  | "wallet/createWalletControls.vue"
  | "wallet/submitTransfer.sdk"
  | "wallet/useExtensionWallet.react"
  | "wallet/useExtensionWallet.vue"
  | "wallet/usePapiWallet.react"
  | "wallet/usePapiWallet.vue"
  | "wallet/useWalletWithEvm.api.react"
  | "wallet/useWalletWithEvm.api.vue"
  | "wallet/useWalletWithEvm.sdk.react"
  | "wallet/useWalletWithEvm.sdk.vue"
  | "wallet/useWalletWithEvmCore.react"
  | "wallet/useWalletWithEvmCore.vue"
  | "xcm/dedot"
  | "xcm/evmTransfer.sdk"
  | "xcm/papi"
  | "xcm/pjs";

export type FragmentRenderer = (template: FragmentId) => Code;

export type FragmentTemplates<Id extends FragmentId = FragmentId> = Record<
  Id,
  () => Code
>;

export type FragmentFactory<Id extends FragmentId> = (
  context: TemplateContext,
  renderFragment: FragmentRenderer,
) => FragmentTemplates<Id>;
