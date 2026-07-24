import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TApiFragmentId = Extract<TFragmentId, `api/${string}`>;

export const createApiFragments: TFragmentFactory<TApiFragmentId> = (
  context,
  renderFragment,
) => {
  const {
    framework,
    extensions: { swap },
    evmWallet,
  } = context;

  return {
    'api/buildApiParams': () => source`const buildApiParams = (
          from: string | undefined,
          to: string | undefined,
          recipient: string,
          sender: string,
          amount: string,
          currencyLocation: object,${
            swap
              ? source`
          currencyToLocation?: object,
          exchange?: string[],`
              : ''
          }
        ): TApiParams => ({
          from,
          to,
          recipient,
          sender,
          currency: {
            location: currencyLocation,
            amount,
          },${
            swap
              ? source`
          ...(currencyToLocation
            ? {
                swapOptions: {
                  currencyTo: { location: currencyToLocation },
                  ...(exchange?.length ? { exchange } : {}),
                },
              }
            : {}),`
              : ''
          }
        });
        `,
    'api/consts':
      () => source`export const API_URL = "https://api.paraspell.xyz/v1";
        `,
    'api/fetchFromApi': () => source`import axios from "axios";
        ${
          evmWallet
            ? source`import type { Hex } from "viem";
        `
            : ''
        }import { API_URL } from "./consts${framework === 'node' ? source`.js` : ''}";
        import type { TApiParams, TApiTransaction, TApiErrorResponse } from "./types${framework === 'node' ? source`.js` : ''}";
        
        const postToApi = async <T>(
          url: string,
          params: TApiParams,
          errorContext: string,
        ): Promise<T> => {
          try {
            const response = await axios.post<T>(url, params);
            return response.data;
          } catch (error) {
            if (axios.isAxiosError<TApiErrorResponse>(error)) {
              const message = error.response?.data.message;
              const serverMessage = message ? \` Server response: \${message}\` : "";
              throw new Error(\`Error while \${errorContext}.\${serverMessage}\`, {
                cause: error,
              });
            }
            throw error;
          }
        };
        
        export const fetchFromApi = (params: TApiParams): Promise<TApiTransaction[]> =>
          postToApi(\`\${API_URL}/x-transfers\`, params, "fetching data");
        
        ${
          evmWallet
            ? source`export const fetchFromEvmApi = (params: TApiParams): Promise<Hex> =>
          postToApi(\`\${API_URL}/evm-x-transfer\`, params, "fetching EVM transaction");
        `
            : ''
        }
        `,
    'api/submitEvmTx': () => source`import {
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
        `,
    'api/submitUsingApi': () => source`import axios from "axios";
        import { Binary } from "polkadot-api";
        import type { PolkadotSigner } from "polkadot-api";
        import { createWsClient } from "polkadot-api/ws";
        import { API_URL } from "../consts";
        import { fetchFromApi${evmWallet ? source`, fetchFromEvmApi` : ''} } from "../fetchFromApi";
        import { requireCurrency${swap ? source`, requireSwapCurrencyTo` : ''} } from "../requireAsset";
        ${
          evmWallet
            ? source`import { submitEvmTx } from "./submitEvmTx";
        `
            : ''
        }import { submitTransaction } from "../utils";
        import type {
          TApiParams,
          TApiTransaction,
          TFormValues${
            evmWallet
              ? source`,
          TEvmOriginHelpers,
          TWalletSubmitOptions`
              : ''
          },
        } from "../types";
        
        ${renderFragment('api/buildApiParams')}
        
        const submitApiTransaction = async (
          apiTx: TApiTransaction,
          signer: PolkadotSigner,
        ) => {
          const response = await axios.get<string[]>(
            \`\${API_URL}/chains/\${apiTx.chain}/ws-endpoints\`,
          );
          const endpoints = response.data;
        
          const client = createWsClient(endpoints[0]);
          try {
            const callData = Binary.fromHex(apiTx.tx);
            const tx = await client.getUnsafeApi().txFromCallData(callData);
            await submitTransaction(tx, signer);
          } finally {
            client.destroy();
          }
        };
        ${
          evmWallet
            ? source`
        export const submitUsingApi = async (
          formValues: TFormValues,
          options: TWalletSubmitOptions<PolkadotSigner>,
          evmOrigins: TEvmOriginHelpers,
        ): Promise<void> => {
          const currency = requireCurrency(formValues.currency);
        ${
          swap
            ? source`  const swapCurrencyTo = requireSwapCurrencyTo(
            formValues.swapEnabled,
            formValues.currencyTo,
          );
        `
            : ''
        }
        
          await evmOrigins.ensureEvmOriginChains();
        
          if (evmOrigins.isEvmOrigin(formValues.from)) {
            if (options.kind !== "evm") {
              throw new Error("EVM origin requires a connected EVM wallet.");
            }
        
            const sender = options.walletClient.account?.address;
            if (!sender) {
              throw new Error("EVM wallet has no connected account.");
            }
        
            const serializedTx = await fetchFromEvmApi(
              buildApiParams(
                formValues.from,
                formValues.to,
                formValues.recipient,
                sender,
                formValues.amount,
                currency.location,${
                  swap
                    ? source`
                formValues.swapEnabled && swapCurrencyTo
                  ? swapCurrencyTo.location
                  : undefined,
                formValues.exchange,`
                    : ''
                }
              ),
            );
            await submitEvmTx(serializedTx, options.walletClient);
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new Error("Substrate origin requires a Polkadot extension wallet.");
          }
        
          const transactions = await fetchFromApi(
            buildApiParams(
              formValues.from,
              formValues.to,
              formValues.recipient,
              options.senderAddress,
              formValues.amount,
              currency.location,${
                swap
                  ? source`
              formValues.swapEnabled && swapCurrencyTo
                ? swapCurrencyTo.location
                : undefined,
              formValues.exchange,`
                  : ''
              }
            ),
          );
        
          for (const apiTx of transactions) {
            await submitApiTransaction(apiTx, options.signer);
          }
        };
        `
            : source`
        export const submitUsingApi = async (
          formValues: TFormValues,
          signer: PolkadotSigner,
          senderAddress: string,
        ): Promise<void> => {
          const currency = requireCurrency(formValues.currency);
        ${
          swap
            ? source`  const swapCurrencyTo = requireSwapCurrencyTo(
            formValues.swapEnabled,
            formValues.currencyTo,
          );
        `
            : ''
        }
        
          const transactions = await fetchFromApi(
            buildApiParams(
              formValues.from,
              formValues.to,
              formValues.recipient,
              senderAddress,
              formValues.amount,
              currency.location,${
                swap
                  ? source`
              formValues.swapEnabled && swapCurrencyTo
                ? swapCurrencyTo.location
                : undefined,
              formValues.exchange,`
                  : ''
              }
            ),
          );
        
          for (const apiTx of transactions) {
            await submitApiTransaction(apiTx, signer);
          }
        };
        `
        }
        `,
    'api/utils': () => source`import {
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
                    new Error(\`Invalid transaction: \${JSON.stringify(error.error)}\`),
                  );
                } else {
                  reject(error);
                }
              },
            });
          });
        };
        `,
  };
};
