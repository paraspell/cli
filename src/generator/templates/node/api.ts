import type { TTemplateContext, TTemplateFile } from '../../types.js';
import { createFragmentFile } from '../fragment-file.js';
import type { TFragmentRenderer } from '../shared/fragment-types.js';
import { source } from '../source.js';

export const createNodeApiTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    extensions: { swap },
    evmWallet,
  } = context;
  const fragment = createFragmentFile(renderFragment);

  return [
    fragment('src/consts.ts', 'api/consts'),
    {
      path: 'src/evm.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('node/getEvmWalletClient')}
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
        import type { PolkadotSigner } from "polkadot-api";
        import { createWsClient } from "polkadot-api/ws";
        import { API_URL } from "./consts.js";
        import { submitPapiTransaction } from "./submitPapiTransaction.js";
        import { Binary } from "./substrate.js";
        import type { TApiTransaction } from "./types.js";
        
        const submitApiTransaction = async (
          apiTx: TApiTransaction,
          signer: PolkadotSigner,
        ): Promise<string> => {
          const response = await axios.get<string[]>(
            \`\${API_URL}/chains/\${apiTx.chain}/ws-endpoints\`,
          );
          const [endpoint] = response.data;
          if (!endpoint) {
            throw new Error(\`No WebSocket endpoint returned for \${apiTx.chain}.\`);
          }
        
          const client = createWsClient(endpoint);
          try {
            const callData = Binary.fromHex(apiTx.tx);
            const tx = await client.getUnsafeApi().txFromCallData(callData);
        
            const result = await submitPapiTransaction(tx, signer);
            return result.txHash;
          } finally {
            client.destroy();
          }
        };
        
        export const submitSubstrateTransfers = async (
          transactions: TApiTransaction[],
          signer: PolkadotSigner,
        ): Promise<string[]> => {
          const hashes: string[] = [];
          for (const apiTx of transactions) {
            hashes.push(await submitApiTransaction(apiTx, signer));
          }
          return hashes;
        };
        `,
    },
    fragment('src/submitPapiTransaction.ts', 'papi/submitTransaction'),
    {
      path: 'src/substrate.ts',
      render: () => source`import { Binary } from "polkadot-api";
        import { getPolkadotSigner } from "polkadot-api/signer";
        ${renderFragment('node/substrate-keyring')}
        
        export const getSubstrateAccount = (secret: string) => {
          const pair = createKeyringPair(secret);
          return {
            address: pair.address,
            signer: getPolkadotSigner(
              pair.publicKey,
              "Sr25519",
              (input) => signBytes(pair, input),
            ),
          };
        };
        
        export { Binary };
        `,
    },
    {
      path: 'src/transfer.ts',
      render:
        () => source`import { fetchFromApi${evmWallet ? source`, fetchFromEvmApi` : ''} } from "./fetchFromApi.js";
        import { submitSubstrateTransfers } from "./submitSubstrate.js";
        ${
          evmWallet
            ? source`import {
          fetchEvmOriginChains,
          getEvmWalletClient,
          isEvmOrigin,
        } from "./evm.js";
        import { submitEvmTx } from "./submitEvmTx.js";
        `
            : ''
        }import { getSubstrateAccount, getSubstrateMnemonic } from "./substrate.js";
        import type { TApiParams, TTransferParams } from "./types.js";
        
        ${renderFragment('api/buildApiParams')}
        
        const defaults: TTransferParams = {
          from: "Astar",
          to: "Hydration",
          amount: "0.1",
          recipient: "//Bob",
        };
        
        export const transferViaApi = async (): Promise<string | string[]> => {
          const params = defaults;
          const { currencyLocation } = params;
          if (!currencyLocation) {
            throw new Error("Configure currencyLocation in defaults.");
          }
        ${
          swap
            ? source`
          const { currencyToLocation } = params;
          if (!currencyToLocation) {
            throw new Error(
              "Configure currencyToLocation in defaults when swap is enabled.",
            );
          }
        `
            : ''
        }
        ${
          evmWallet
            ? source`
          const evmOriginChains = await fetchEvmOriginChains();
        
          if (isEvmOrigin(params.from, evmOriginChains)) {
            const walletClient = getEvmWalletClient(params.from);
            const sender = walletClient.account.address;
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
          const { address: sender, signer } = getSubstrateAccount(
            getSubstrateMnemonic(),
          );
        
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
          return submitSubstrateTransfers(transactions, signer);
        };
        `,
    },
    fragment('src/types.ts', 'types/api.node'),
    fragment('tsconfig.json', 'node/tsconfig'),
  ];
};
