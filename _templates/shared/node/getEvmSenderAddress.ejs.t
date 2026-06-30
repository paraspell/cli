export const getEvmSenderAddress = (origin: string): string => {
  const walletClient = getEvmWalletClient(origin);
  const account = walletClient.account;
  if (!account) {
    throw new Error("EVM wallet client has no account configured.");
  }
  return account.address;
};
