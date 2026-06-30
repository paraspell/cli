import {
  InvalidTxError,
  type PolkadotSigner,
  type Transaction,
  type TxFinalizedPayload,
} from "polkadot-api";

export const submitTransaction = async (
  tx: Transaction,
  signer: PolkadotSigner,
  onSign?: () => void,
): Promise<TxFinalizedPayload | { txHash: string }> => {
  return new Promise((resolve, reject) => {
    tx.signSubmitAndWatch(signer).subscribe({
      next: (event) => {
        if (event.type === "signed") {
          onSign?.();
        }

        if (event.type === "finalized") {
          if (!event.ok) {
            const errorMsg = event.dispatchError?.value
              ? JSON.stringify(event.dispatchError.value)
              : "Transaction failed";
            reject(new Error(errorMsg));
          } else {
            resolve(event);
          }
        }
      },
      error: (error) => {
        if (error instanceof InvalidTxError) {
          reject(
            new Error(`Invalid transaction: ${JSON.stringify(error.error)}`),
          );
        } else {
          reject(error);
        }
      },
    });
  });
};
