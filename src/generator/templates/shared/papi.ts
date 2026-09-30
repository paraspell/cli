import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TPapiFragmentId = Extract<TFragmentId, `papi/${string}`>;

export const createPapiFragments: TFragmentFactory<TPapiFragmentId> = () => ({
  'papi/submitTransaction': () => source`import {
      InvalidTxError,
      type Transaction,
      type TxFinalizedPayload,
    } from "polkadot-api";
    import type { CommonSignerTxCreator } from "@polkadot-api/signers-common";

    export const submitPapiTransaction = async (
      tx: Transaction,
      signer: CommonSignerTxCreator,
    ): Promise<TxFinalizedPayload> => {
      try {
        const result = await tx.createAndSubmit(signer);
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
            { cause: error },
          );
        }
        throw error;
      }
    };
    `,
});
