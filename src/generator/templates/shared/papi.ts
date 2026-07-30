import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TPapiFragmentId = Extract<TFragmentId, `papi/${string}`>;

export const createPapiFragments: TFragmentFactory<TPapiFragmentId> = () => ({
  'papi/submitTransaction': () => source`import {
      InvalidTxError,
      type PolkadotSigner,
      type Transaction,
      type TxFinalizedPayload,
    } from "polkadot-api";

    export const submitPapiTransaction = async (
      tx: Transaction,
      signer: PolkadotSigner,
    ): Promise<TxFinalizedPayload> => {
      try {
        const result = await tx.signAndSubmit(signer);
        if (!result.ok) {
          const message = result.dispatchError?.value
            ? JSON.stringify(result.dispatchError.value)
            : "Transaction failed";
          throw new Error(message);
        }
        return result;
      } catch (error) {
        if (error instanceof InvalidTxError) {
          throw new Error(
            \`Invalid transaction: \${JSON.stringify(error.error)}\`,
          );
        }
        throw error;
      }
    };
    `,
});
