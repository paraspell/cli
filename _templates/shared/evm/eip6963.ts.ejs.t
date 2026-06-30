import { createStore, type EIP6963ProviderDetail } from "mipd";

export const evmProviderStore =
  typeof window === "undefined" ? undefined : createStore();

export const getEip6963Providers = (): readonly EIP6963ProviderDetail[] =>
  evmProviderStore?.getProviders() ?? [];
