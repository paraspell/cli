import type { EIP6963ProviderDetail } from "mipd";
import type { EvmProviderOption } from "../types";

export const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const toProviderOptions = (
  availableProviders: readonly EIP6963ProviderDetail[],
): EvmProviderOption[] =>
  availableProviders.map((entry) => ({
    uuid: entry.info.uuid,
    label: entry.info.name,
  }));

export const parseRequestedAccounts = (result: unknown): string[] => {
  if (!Array.isArray(result)) {
    throw new Error("Wallet returned an invalid accounts response.");
  }
  return result.filter((value): value is string => typeof value === "string");
};
