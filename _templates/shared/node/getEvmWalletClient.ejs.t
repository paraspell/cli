import {
  createWalletClient,
  http,
  isHex,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getViemChainForOrigin } from "./getViemChain.js";

export const getEvmWalletClient = (origin: string): WalletClient => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY env var is required for EVM transfers (0x-prefixed hex).",
    );
  }

  if (!isHex(privateKey)) {
    throw new Error("PRIVATE_KEY must be a 0x-prefixed hex string.");
  }

  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: getViemChainForOrigin(origin),
    transport: http(),
  });
};
