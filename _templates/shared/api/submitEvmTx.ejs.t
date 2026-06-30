import {
  createPublicClient,
  http,
  parseTransaction,
  type Hex,
  type WalletClient,
} from "viem";

export const submitEvmTx = async (
  serializedTx: Hex,
  walletClient: WalletClient,
): Promise<Hex> => {
  const account = walletClient.account;
  if (!account) {
    throw new Error("Wallet has no account. Connect wallet and try again.");
  }

  const chain = walletClient.chain;
  if (!chain) {
    throw new Error("Wallet client has no chain configured.");
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const parsed = parseTransaction(serializedTx);

  const [gas, fees, nonce] = await Promise.all([
    publicClient.estimateGas({
      account,
      to: parsed.to ?? undefined,
      data: parsed.data,
      value: parsed.value,
    }),
    publicClient.estimateFeesPerGas(),
    publicClient.getTransactionCount({ address: account.address, blockTag: "pending" }),
  ]);

  return walletClient.sendTransaction({
    account,
    chain,
    to: parsed.to ?? undefined,
    data: parsed.data,
    value: parsed.value,
    gas,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    nonce,
  });
};
