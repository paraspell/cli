import type { TTemplateContext, TTemplateFile } from '../types.js';
import { createFragmentFile } from './fragment-file.js';
import type { TFragmentRenderer } from './shared/fragment-types.js';
import { source } from './source.js';

export const createXcmApiNodeTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    extensions: { evm, swap },
    evmWallet,
    defaultOriginChain,
  } = context;
  const fragment = createFragmentFile(renderFragment);

  return [
    fragment('src/consts.ts', 'api/consts'),
    {
      path: 'src/evm.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('node/getEvmWalletClient')}
        ${renderFragment('node/getEvmSenderAddress')}
        export { fetchEvmOriginChains, isEvmOrigin } from "./evmOrigins.js";
        `,
    },
    fragment('src/evmOrigins.ts', 'evm/evmOrigins.api.node', !evmWallet),
    fragment('src/fetchFromApi.ts', 'api/fetchFromApi'),
    fragment('src/getViemChain.ts', 'evm/getViemChain', !evmWallet),
    fragment('src/index.ts', 'node/server'),
    fragment('src/submitEvmTx.ts', 'api/submitEvmTx', !evmWallet),
    {
      path: 'src/submitSubstrate.ts',
      render: () => source`import axios from "axios";
        import { createWsClient } from "polkadot-api/ws";
        import { API_URL } from "./consts.js";
        import {
          Binary,
          getSignerFromSecret,
          getSubstrateMnemonic,
        } from "./substrate.js";
        import type { TApiTransaction } from "./types.js";
        
        const submitApiTransaction = async (
          apiTx: TApiTransaction,
        ): Promise<string> => {
          const response = await axios.get<string[]>(
            \`\${API_URL}/chains/\${apiTx.chain}/ws-endpoints\`,
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
          transactions: TApiTransaction[],
        ): Promise<string[]> => {
          const hashes: string[] = [];
          for (const apiTx of transactions) {
            hashes.push(await submitApiTransaction(apiTx));
          }
          return hashes;
        };
        `,
    },
    {
      path: 'src/substrate.ts',
      render: () => source`import { Binary } from "polkadot-api";
        import { getPolkadotSigner } from "polkadot-api/signer";
        ${renderFragment('node/substrate-keyring')}
        
        export const getSubstrateSenderAddress = async (
          secret: string,
        ): Promise<string> => {
          return createKeyringPair(secret).address;
        };
        
        export const getSignerFromSecret = async (secret: string) => {
          const pair = createKeyringPair(secret);
          return getPolkadotSigner(
            pair.publicKey,
            "Sr25519",
            (input) => signBytes(pair, input),
          );
        };
        
        export { Binary };
        `,
    },
    {
      path: 'src/transfer.ts',
      render: () => source`import axios from "axios";
        import { API_URL } from "./consts.js";
        import { fetchFromApi${evmWallet ? source`, fetchFromEvmApi` : ''} } from "./fetchFromApi.js";
        import { submitSubstrateTransfers } from "./submitSubstrate.js";
        ${
          evmWallet
            ? source`import {
          fetchEvmOriginChains,
          getEvmSenderAddress,
          getEvmWalletClient,
          isEvmOrigin,
        } from "./evm.js";
        import { submitEvmTx } from "./submitEvmTx.js";
        `
            : ''
        }import { getSubstrateMnemonic, getSubstrateSenderAddress } from "./substrate.js";
        import type {
          TAssetInfo,
          TApiErrorResponse,
          TApiParams,
          TTransferParams,
        } from "./types.js";
        
        ${renderFragment('api/buildApiParams')}
        
        const defaults: TTransferParams = {
          from: "${defaultOriginChain}",
          to: "Hydration",
          amount: "0.1",
          recipient: "//Bob",
        };
        
        type TResolveCurrencyOptions = {
          location?: object;
          origin: string;
          destination: string;
          preferredSymbol?: string;
          label: string;
        };

        const resolveCurrencyLocation = async ({
          location,
          origin,
          destination,
          preferredSymbol,
          label,
        }: TResolveCurrencyOptions): Promise<object> => {
          try {
            const response = await axios.get<TAssetInfo[]>(
              \`\${API_URL}/supported-assets?origin=\${encodeURIComponent(origin)}&destination=\${encodeURIComponent(destination)}\`,
            );
            const assets = response.data;
            if (location) {
              const asset = assets.find(
                (entry) => JSON.stringify(entry.location) === JSON.stringify(location),
              );
              if (!asset) {
                throw new Error(
                  \`Configured \${label} location not found for \${origin} -> \${destination}\`,
                );
              }
              return asset.location;
            }

            const fallbackAsset = preferredSymbol
              ? assets.find((entry) => entry.symbol === preferredSymbol)
              : assets.find((entry) => entry.symbol);
            if (!fallbackAsset) {
              const detail = preferredSymbol ? \` \${preferredSymbol}\` : "";
              throw new Error(
                \`No supported\${detail} asset found for \${origin} -> \${destination}\`,
              );
            }
            return fallbackAsset.location;
          } catch (error) {
            if (axios.isAxiosError<TApiErrorResponse>(error)) {
              const message = error.response?.data.message;
              const serverMessage = message ? \` Server response: \${message}\` : "";
              throw new Error(\`Error while resolving \${label}.\${serverMessage}\`, {
                cause: error,
              });
            }
            throw error;
          }
        };
        
        export const transferViaApi = async (): Promise<string | string[]> => {
          const params = defaults;
          const currencyLocation = await resolveCurrencyLocation({
            location: params.currencyLocation,
            origin: params.from,
            destination: params.to,
            label: "asset",
          });
        ${
          swap
            ? source`
          const currencyToLocation = await resolveCurrencyLocation({
            location: params.currencyToLocation,
            origin: params.from,
            destination: params.to,
            preferredSymbol: "${evm ? 'USDC' : 'DOT'}",
            label: "swap asset",
          });
        `
            : ''
        }
        ${
          evmWallet
            ? source`
          const evmOriginChains = await fetchEvmOriginChains();
        
          if (isEvmOrigin(params.from, evmOriginChains)) {
            const sender = getEvmSenderAddress(params.from);
            const walletClient = getEvmWalletClient(params.from);
            const serializedTx = await fetchFromEvmApi(
              buildApiParams({
                from: params.from,
                to: params.to,
                recipient: params.recipient,
                sender,
                amount: params.amount,
                currencyLocation,${
                  swap
                    ? source`
                currencyToLocation,
                exchange: params.exchange,`
                    : ''
                }
              }),
            );
            const txHash = await submitEvmTx(serializedTx, walletClient);
            return txHash;
          }
        `
            : ''
        }
          const mnemonic = getSubstrateMnemonic();
          const sender = await getSubstrateSenderAddress(mnemonic);
        
          const transactions = await fetchFromApi(
            buildApiParams({
              from: params.from,
              to: params.to,
              recipient: params.recipient,
              sender,
              amount: params.amount,
              currencyLocation,${
                swap
                  ? source`
              currencyToLocation,
              exchange: params.exchange,`
                  : ''
              }
            }),
          );
          return await submitSubstrateTransfers(transactions);
        };
        `,
    },
    fragment('src/types.ts', 'types/api.node'),
    fragment('tsconfig.json', 'node/tsconfig'),
  ];
};
