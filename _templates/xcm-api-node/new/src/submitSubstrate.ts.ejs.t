---
to: src/submitSubstrate.ts
---
import axios from "axios";
import { createWsClient } from "polkadot-api/ws";
import { API_URL } from "./consts.js";
import {
  Binary,
  getSignerFromSecret,
  getSubstrateMnemonic,
} from "./substrate.js";
import type { ApiTransaction } from "./types.js";

const submitApiTransaction = async (
  apiTx: ApiTransaction,
): Promise<string> => {
  const response = await axios.get<string[]>(
    `${API_URL}/chains/${apiTx.chain}/ws-endpoints`,
  );
  const endpoints = response.data;

  const client = createWsClient(endpoints[0]);
  try {
    const signer = await getSignerFromSecret(getSubstrateMnemonic());
    const callData = Binary.fromHex(apiTx.tx);
    const tx = await client.getUnsafeApi().txFromCallData(callData);

    return await new Promise<string>((resolve, reject) => {
      tx.signSubmitAndWatch(signer).subscribe({
        next: (event) => {
          if (event.type === "finalized") {
            if (!event.ok) {
              reject(new Error("Transaction failed"));
            } else {
              resolve(event.txHash);
            }
          }
        },
        error: reject,
      });
    });
  } finally {
    client.destroy();
  }
};

export const submitSubstrateTransfers = async (
  transactions: ApiTransaction[],
): Promise<string[]> => {
  const hashes: string[] = [];
  for (const apiTx of transactions) {
    hashes.push(await submitApiTransaction(apiTx));
  }
  return hashes;
};
