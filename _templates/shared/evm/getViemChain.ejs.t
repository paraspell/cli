import type { Chain } from "viem";<% if (evm) { %>
import { darwinia, moonbeam, moonriver } from "viem/chains";<% } %><% if (snowbridge) { %>
import { mainnet } from "viem/chains";<% } %>

const VIEM_CHAIN_BY_ORIGIN: Record<string, Chain> = {<% if (evm) { %>
  Moonbeam: moonbeam,
  Moonriver: moonriver,
  Darwinia: darwinia,<% } %><% if (snowbridge) { %>
  Ethereum: mainnet,<% } %>
};

export const getViemChainForOrigin = (origin: string): Chain => {
  const chain = VIEM_CHAIN_BY_ORIGIN[origin];
  if (!chain) {
    throw new Error(`No viem chain configured for origin: ${origin}`);
  }
  return chain;
};
