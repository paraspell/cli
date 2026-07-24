import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmApiNodeTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    projectName,
    packageManager,
    installCmd,
    startCmd,
    extensions: { evm, swap, snowbridge },
    evmWallet,
    polkadotApi,
    polkadotKeyring,
    polkadotUtilCrypto,
    dotenv,
    express,
    viem,
    axios,
    typesExpress,
    typesNode,
    tsx,
    typescript,
    eslintJs,
    eslint,
    eslintConfigPrettier,
    globals,
    prettier,
    typescriptEslint,
  } = context;

  return [
    {
      path: '.gitignore',
      skip: false,
      render: () => source`node_modules
        dist
        
        # Local secrets — never commit SUBSTRATE_MNEMONIC, PRIVATE_KEY, or RPC keys.
        .env
        .env.local
        .env.*.local
        
        *.log
        .DS_Store
        `,
    },
    {
      path: 'LICENSE',
      skip: false,
      render: () => source`${renderFragment('LICENSE')}
        `,
    },
    {
      path: 'README.md',
      skip: false,
      render: () => source`# ParaSpell XCM API — Node.js example
        
        Headless example: build transfers via the [XCM API](https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api), then sign with **Polkadot API** (substrate)${evmWallet ? source` or **viem** (EVM origins)` : ''}.
        
        By default it calls the public ParaSpell API at \`https://api.paraspell.xyz/v1\` (see \`src/consts.ts\`). For production, consider [deploying your own API](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html).
        
        ## Environment
        
        Add your wallet secrets to \`.env\`:
        
        | Variable | Used for |
        |----------|----------|
        | \`SUBSTRATE_MNEMONIC\` | Substrate routes: mnemonic or \`//Dev\` URI (mnemonics: \`"word1 word2 ..."\`) |${
          evmWallet
            ? source`
        | \`PRIVATE_KEY\` | EVM routes: \`0x\`-prefixed hex for viem |`
            : ''
        }
        | \`PORT\` | Optional. HTTP port (default \`3000\`) |
        
        ## Usage
        
        \`\`\`bash
        ${installCmd}
        ${startCmd}
        curl -X POST http://localhost:3000/
        \`\`\`
        
        The server starts without submitting a transfer. Send \`POST /\` to sign and submit the configured XCM transfer (replace \`3000\` with your \`PORT\` if you set one).
        
        > **Heads up:** the generated example signs and broadcasts a **live** XCM transfer on \`POST /\`. Use a dev/throwaway account while testing. Keep wallet secrets in \`.env\` (gitignored) — never on the command line or in version control.
        
        ## Extensions

        | Extension | Behavior |
        |---------|----------|
        | Base | \`POST /x-transfers\` + PAPI \`signSubmitAndWatch\` |${
          swap
            ? source`
        | Swap | \`swapOptions\` on API request |`
            : ''
        }${
          evmWallet
            ? source`
        | EVM | \`POST /evm-x-transfer\` + viem \`sendTransaction\` |`
            : ''
        }${
          snowbridge
            ? source`
        | Snowbridge | \`Ethereum\` origins via API |`
            : ''
        }

        ## Scripts

        | Command | Description |
        |---------|-------------|
        | \`${packageManager} start\` | Start the server |
        | \`${packageManager} run build\` | Compile the project |
        | \`${packageManager} run typecheck\` | Check TypeScript types |
        | \`${packageManager} run lint\` | Lint the project |
        | \`${packageManager} run lint:fix\` | Fix auto-fixable lint issues |
        | \`${packageManager} run format\` | Format the project with Prettier |
        | \`${packageManager} run format:check\` | Check Prettier formatting |
        
        ## Docs
        
        - [Getting started](https://paraspell.github.io/docs/xcm-api/getting-started.html)
        - [Deploy the API yourself](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html)
        
        ## License
        
        MIT — see [LICENSE](LICENSE).
        `,
    },
    {
      path: 'package.json',
      skip: false,
      render: () => source`{
          "name": "${projectName}",
          "private": true,
          "version": "1.0.0",
          "type": "module",
          "scripts": {
            "start": "tsx src/index.ts",
            "build": "tsc",
            "typecheck": "tsc --noEmit",
            "lint": "eslint . --max-warnings 0",
            "lint:fix": "eslint . --fix",
            "format": "prettier . --write",
            "format:check": "prettier . --check"
          },
          "dependencies": {
            "axios": "${axios}",
            "polkadot-api": "${polkadotApi}",
            "@polkadot/keyring": "${polkadotKeyring}",
            "@polkadot/util-crypto": "${polkadotUtilCrypto}",
            "dotenv": "${dotenv}",
            "express": "${express}"${
              evmWallet
                ? source`,
            "viem": "${viem}"`
                : ''
            }
          },
          "devDependencies": {
            "@eslint/js": "${eslintJs}",
            "@types/express": "${typesExpress}",
            "@types/node": "${typesNode}",
            "eslint": "${eslint}",
            "eslint-config-prettier": "${eslintConfigPrettier}",
            "globals": "${globals}",
            "prettier": "${prettier}",
            "tsx": "${tsx}",
            "typescript": "${typescript}",
            "typescript-eslint": "${typescriptEslint}"
          }
        }
        `,
    },
    {
      path: 'src/consts.ts',
      skip: false,
      render: () => source`${renderFragment('api/consts')}
        `,
    },
    {
      path: 'src/evm.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('node/getEvmWalletClient')}
        ${renderFragment('node/getEvmSenderAddress')}
        export { fetchEvmOriginChains, isEvmOrigin } from "./evmOrigins.js";
        `,
    },
    {
      path: 'src/evmOrigins.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/evmOrigins.api.node')}
        `,
    },
    {
      path: 'src/fetchFromApi.ts',
      skip: false,
      render: () => source`${renderFragment('api/fetchFromApi')}
        `,
    },
    {
      path: 'src/getViemChain.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('evm/getViemChain')}
        `,
    },
    {
      path: 'src/index.ts',
      skip: false,
      render: () => source`import "dotenv/config";
        import { cryptoWaitReady } from "@polkadot/util-crypto";
        import express from "express";
        import { transferViaApi } from "./transfer.js";
        
        await cryptoWaitReady();
        
        const app = express();
        app.use(express.json());
        
        app.post("/", async (_req, res) => {
          try {
            const result = await transferViaApi();
            res.status(200).json({ success: true, result });
          } catch (error) {
            const message = error instanceof Error || error instanceof ErrorEvent ? error.message : String(error);
            res.status(500).json({ success: false, error: message });
          }
        });
        
        const port = Number(process.env.PORT ?? 3000);
        app.listen(port, () => {
          console.log(\`Server listening on http://localhost:\${port}\`);
          console.log("POST / to submit the configured XCM transfer.");
        });
        `,
    },
    {
      path: 'src/submitEvmTx.ts',
      skip: Boolean(!evmWallet),
      render: () => source`${renderFragment('api/submitEvmTx')}
        `,
    },
    {
      path: 'src/submitSubstrate.ts',
      skip: false,
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
      skip: false,
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
      skip: false,
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
          from: "${snowbridge ? 'Ethereum' : evm ? 'Moonbeam' : 'Astar'}",
          to: "Hydration",
          amount: "0.1",
          recipient: "//Bob",
        };
        
        const resolveCurrencyLocation = async (
          location: object | undefined,
          origin: string,
          destination: string,
        ): Promise<object> => {
          try {
            const response = await axios.get<TAssetInfo[]>(
              \`\${API_URL}/supported-assets?origin=\${origin}&destination=\${destination}\`,
            );
            const assets = response.data;
            if (location) {
              const asset = assets.find(
                (entry) => JSON.stringify(entry.location) === JSON.stringify(location),
              );
              if (!asset) {
                throw new Error(
                  \`Configured currency location not found for \${origin} -> \${destination}\`,
                );
              }
              return asset.location;
            }
            const nativeAsset = assets.find((entry) => entry.symbol);
            if (!nativeAsset) {
              throw new Error(\`No supported assets found for \${origin} -> \${destination}\`);
            }
            return nativeAsset.location;
          } catch (error) {
            if (axios.isAxiosError<TApiErrorResponse>(error)) {
              const message = error.response?.data.message;
              const serverMessage = message ? \` Server response: \${message}\` : "";
              throw new Error(\`Error while resolving asset.\${serverMessage}\`, {
                cause: error,
              });
            }
            throw error;
          }
        };
        
        ${
          swap
            ? source`const resolveCurrencyToLocation = async (
          location: object | undefined,
          origin: string,
          destination: string,
        ): Promise<object> => {
          try {
            const response = await axios.get<TAssetInfo[]>(
              \`\${API_URL}/supported-assets?origin=\${origin}&destination=\${destination}\`,
            );
            const assets = response.data;
            if (location) {
              const asset = assets.find(
                (entry) => JSON.stringify(entry.location) === JSON.stringify(location),
              );
              if (!asset) {
                throw new Error(
                  \`Configured swap currency location not found for \${origin} -> \${destination}\`,
                );
              }
              return asset.location;
            }
            const targetSymbol = "${evm ? 'USDC' : 'DOT'}";
            const asset = assets.find((entry) => entry.symbol === targetSymbol);
            if (!asset) {
              throw new Error(
                \`Asset \${targetSymbol} not found for \${origin} -> \${destination}\`,
              );
            }
            return asset.location;
          } catch (error) {
            if (axios.isAxiosError<TApiErrorResponse>(error)) {
              const message = error.response?.data.message;
              const serverMessage = message ? \` Server response: \${message}\` : "";
              throw new Error(\`Error while resolving swap asset.\${serverMessage}\`, {
                cause: error,
              });
            }
            throw error;
          }
        };
        
        `
            : ''
        }export const transferViaApi = async (): Promise<string | string[]> => {
          const params = defaults;
          const currencyLocation = await resolveCurrencyLocation(
            params.currencyLocation,
            params.from,
            params.to,
          );
        ${
          swap
            ? source`
          const currencyToLocation = await resolveCurrencyToLocation(
            params.currencyToLocation,
            params.from,
            params.to,
          );
        `
            : ''
        }
        ${
          evmWallet
            ? source`
          await fetchEvmOriginChains();
        
          if (isEvmOrigin(params.from)) {
            const sender = getEvmSenderAddress(params.from);
            const walletClient = getEvmWalletClient(params.from);
            const serializedTx = await fetchFromEvmApi(
              buildApiParams(
                params.from,
                params.to,
                params.recipient,
                sender,
                params.amount,
                currencyLocation,${
                  swap
                    ? source`
                currencyToLocation,
                params.exchange,`
                    : ''
                }
              ),
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
            buildApiParams(
              params.from,
              params.to,
              params.recipient,
              sender,
              params.amount,
              currencyLocation,${
                swap
                  ? source`
              currencyToLocation,
              params.exchange,`
                  : ''
              }
            ),
          );
          return await submitSubstrateTransfers(transactions);
        };
        `,
    },
    {
      path: 'src/types.ts',
      skip: false,
      render: () => source`${renderFragment('types/api.node')}
        `,
    },
    {
      path: 'tsconfig.json',
      skip: false,
      render: () => source`{
          "compilerOptions": {
            "target": "ES2022",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "strict": true,
            "skipLibCheck": true,
            "esModuleInterop": true,
            "types": ["node"],
            "outDir": "dist",
            "rootDir": "src"
          },
          "include": ["src"]
        }
        `,
    },
  ];
};
