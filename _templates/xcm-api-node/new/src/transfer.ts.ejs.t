---
to: src/transfer.ts
---
import axios from "axios";
import { API_URL } from "./consts.js";
import { fetchFromApi<% if (evmWallet) { %>, fetchFromEvmApi<% } %> } from "./fetchFromApi.js";
import { submitSubstrateTransfers } from "./submitSubstrate.js";
<% if (evmWallet) { %>import {
  fetchEvmOriginChains,
  getEvmSenderAddress,
  getEvmWalletClient,
  isEvmOrigin,
} from "./evm.js";
import { submitEvmTx } from "./submitEvmTx.js";
<% } %>import { getSubstrateMnemonic, getSubstrateSenderAddress } from "./substrate.js";
import type {
  AssetInfo,
  ApiErrorResponse,
  ApiParams,
  TransferParams,
} from "./types.js";

<%- h.includeShared('shared/api/buildApiParams.ejs.t') %>

const defaults: TransferParams = {
  from: "<%= snowbridge ? 'Ethereum' : evm ? 'Moonbeam' : 'Astar' %>",
  to: "Hydration",
  amount: "0.1",
  recipient: "//Bob",
};

const resolveCurrencyLocation = async (
  location: object | undefined,
  origin: string,
  destination: string,
): Promise<object> => {
  try {
    const response = await axios.get<AssetInfo[]>(
      `${API_URL}/supported-assets?origin=${origin}&destination=${destination}`,
    );
    const assets = response.data;
    if (location) {
      const asset = assets.find(
        (entry) => JSON.stringify(entry.location) === JSON.stringify(location),
      );
      if (!asset) {
        throw new Error(
          `Configured currency location not found for ${origin} -> ${destination}`,
        );
      }
      return asset.location;
    }
    const nativeAsset = assets.find((entry) => entry.symbol);
    if (!nativeAsset) {
      throw new Error(`No supported assets found for ${origin} -> ${destination}`);
    }
    return nativeAsset.location;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const message = error.response?.data.message;
      const serverMessage = message ? ` Server response: ${message}` : "";
      throw new Error(`Error while resolving asset.${serverMessage}`, {
        cause: error,
      });
    }
    throw error;
  }
};

<% if (swap) { %>const resolveCurrencyToLocation = async (
  location: object | undefined,
  origin: string,
  destination: string,
): Promise<object> => {
  try {
    const response = await axios.get<AssetInfo[]>(
      `${API_URL}/supported-assets?origin=${origin}&destination=${destination}`,
    );
    const assets = response.data;
    if (location) {
      const asset = assets.find(
        (entry) => JSON.stringify(entry.location) === JSON.stringify(location),
      );
      if (!asset) {
        throw new Error(
          `Configured swap currency location not found for ${origin} -> ${destination}`,
        );
      }
      return asset.location;
    }
    const targetSymbol = "<%= evm ? 'USDC' : 'DOT' %>";
    const asset = assets.find((entry) => entry.symbol === targetSymbol);
    if (!asset) {
      throw new Error(
        `Asset ${targetSymbol} not found for ${origin} -> ${destination}`,
      );
    }
    return asset.location;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const message = error.response?.data.message;
      const serverMessage = message ? ` Server response: ${message}` : "";
      throw new Error(`Error while resolving swap asset.${serverMessage}`, {
        cause: error,
      });
    }
    throw error;
  }
};

<% } %>export const transferViaApi = async (): Promise<string | string[]> => {
  const params = defaults;
  const currencyLocation = await resolveCurrencyLocation(
    params.currencyLocation,
    params.from,
    params.to,
  );
<% if (swap) { %>
  const currencyToLocation = await resolveCurrencyToLocation(
    params.currencyToLocation,
    params.from,
    params.to,
  );
<% } %>
<% if (evmWallet) { %>
  await fetchEvmOriginChains();

  if (isEvmOrigin(params.from)) {
    const sender = getEvmSenderAddress(params.from);
    const walletClient = getEvmWalletClient(params.from);
    const serializedTx = await fetchFromEvmApi(
      buildApiParams(
        params.from,
        params.to,
        params.recipient,
        sender,
        params.amount,
        currencyLocation,<% if (swap) { %>
        currencyToLocation,
        params.exchange,<% } %>
      ),
    );
    const txHash = await submitEvmTx(serializedTx, walletClient);
    return txHash;
  }
<% } -%>

  const mnemonic = getSubstrateMnemonic();
  const sender = await getSubstrateSenderAddress(mnemonic);

  const transactions = await fetchFromApi(
    buildApiParams(
      params.from,
      params.to,
      params.recipient,
      sender,
      params.amount,
      currencyLocation,<% if (swap) { %>
      currencyToLocation,
      params.exchange,<% } %>
    ),
  );
  return await submitSubstrateTransfers(transactions);
};
