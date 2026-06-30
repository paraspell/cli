---
to: src/transfer.ts
---
<% if (swap) { %>import "@paraspell/swap";
<% } %>import {
  Builder,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getSupportedAssets,
  assertToIsString,<% if (client !== 'papi') { %>
  createChainClient,<% } %><% if (evmWallet) { %>
  isChainEvm,<% } %>
} from "<%= sdkPackage %>";<% if (client === 'pjs' || client === 'dedot') { %>
import { assertSubstrateOrigin } from "./isEvmOrigin.js";<% } %><% if (evmWallet) { %>
import {
  getEvmWalletClient,
  submitEvmTransfer,
} from "./evm.js";<% } %>
import { getSubstrateSigner } from "./substrate.js";
import type { TChain, TDestination, TLocation } from "<%= sdkPackage %>";
import type { TransferParams } from "./types.js";

const defaults: TransferParams = {
  from: "<%= snowbridge ? 'Ethereum' : evm ? 'Moonbeam' : 'Astar' %>",
  to: "Hydration",
  amount: "0.1",
  recipient: "//Bob",
};

const resolveCurrencyLocation = async (
  from: TChain,
  to: TDestination,
  location?: TLocation,
) => {
  if (location) {
    assertToIsString(to);
    findAssetInfoOrThrow(from, { location }, to);
    return location;
  }
  return findNativeAssetInfoOrThrow(from).location;
};

<% if (swap) { %>const resolveCurrencyToLocation = async (
  from: TChain,
  to: TDestination,
  location?: TLocation,
) => {
  assertToIsString(to);
  if (location) {
    findAssetInfoOrThrow(from, { location }, to);
    return location;
  }
  const assets = await getSupportedAssets(from, to);
  const targetSymbol = "<%= evm ? 'USDC' : 'DOT' %>";
  const asset = assets.find((entry) => entry.symbol === targetSymbol);
  if (!asset) {
    throw new Error(
      `Asset ${targetSymbol} not found for ${from} -> ${to}`,
    );
  }
  return asset.location;
};

<% } %>export const transferAsset = async (): Promise<string | string[]> => {
  const opts = defaults;
  const currencyLocation = await resolveCurrencyLocation(
    opts.from,
    opts.to,
    opts.currencyLocation,
  );

<% if (swap) { %>  const currencyToLocation = await resolveCurrencyToLocation(
    opts.from,
    opts.to,
    opts.currencyToLocation,
  );

  <% if (evmWallet) { %>const swapSender = isChainEvm(opts.from)
    ? getEvmWalletClient(opts.from)
    : await getSubstrateSigner();
  <% } else { %>const swapSender = await getSubstrateSigner();
  <% } %>
  const swapBuilder = Builder()
    .from(opts.from)
    .to(opts.to)
    .currency({
      location: currencyLocation,
      amount: opts.amount,
    })
    .recipient(opts.recipient)
    .sender(swapSender)
    .swap({
      currencyTo: { location: currencyToLocation },
    });

  return await swapBuilder.signAndSubmitAll();

<% } else { %><% if (evmWallet) { %>  if (isChainEvm(opts.from)) {
    return await submitEvmTransfer({
      ...opts,
      currencyLocation,
    });
  }

<% } %>  const sender = await getSubstrateSigner();
<% if (client === 'papi') { %>
  const builder = Builder()
    .from(opts.from)
    .to(opts.to)
    .currency({
      location: currencyLocation,
      amount: opts.amount,
    })
    .recipient(opts.recipient)
    .sender(sender);
<% } else { %>
  assertSubstrateOrigin(opts.from);
  const client = await createChainClient(opts.from);
  const builder = Builder(client)
    .from(opts.from)
    .to(opts.to)
    .currency({
      location: currencyLocation,
      amount: opts.amount,
    })
    .recipient(opts.recipient)
    .sender(sender);
<% } %>

  return await builder.signAndSubmit();
<% } %>
};
