import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmSdkNodeTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    client,
    sdkPackage,
    extensions: { evm, swap, snowbridge },
    evmWallet,
  } = context;

  return [
    {
      path: 'src/evm.ts',
      skip: !evmWallet,
      render: () => source`${
        !swap
          ? source`import {
          Builder,
          isChainEvm,
        } from "${sdkPackage}";
        import type { TTransferParams } from "./types.js";
        `
          : ''
      }${renderFragment('node/getEvmWalletClient')}${
        !swap
          ? source`
        export const submitEvmTransfer = async (
          params: TTransferParams,
        ): Promise<string> => {
          const { from, to, recipient, amount, currencyLocation } = params;
        
          if (!isChainEvm(from)) {
            throw new Error(\`Unsupported EVM origin: \${from}\`);
          }
          if (!currencyLocation) {
            throw new Error("Currency location is required for EVM transfers.");
          }
        
          const walletClient = getEvmWalletClient(from);
        
          return await Builder()
            .from(from)
            .to(to)
            .currency({
              location: currencyLocation,
              amount,
            })
            .recipient(recipient)
            .sender(walletClient)
            .signAndSubmit();
        };
        `
          : ''
      }
        `,
    },
    {
      path: 'src/getViemChain.ts',
      skip: !evmWallet,
      render: () => source`${renderFragment('evm/getViemChain')}
        `,
    },
    {
      path: 'src/index.ts',
      render: () => source`import "dotenv/config";
        import { cryptoWaitReady } from "@polkadot/util-crypto";
        ${renderFragment('paraspell-side-effects')}import express from "express";
        import { transferAsset } from "./transfer.js";
        
        await cryptoWaitReady();
        
        const app = express();
        app.use(express.json());
        
        app.post("/", async (_req, res) => {
          try {
            const result = await transferAsset();
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
      path: 'src/isEvmOrigin.ts',
      skip: client === 'papi' || swap,
      render: () => source`${renderFragment('evm/isEvmOrigin.sdk')}
        `,
    },
    {
      path: 'src/substrate.ts',
      render: () => source`${
        client === 'papi'
          ? source`import { getPolkadotSigner } from "polkadot-api/signer";
        import type { PolkadotSigner } from "polkadot-api";
        `
          : source`${
              client === 'pjs'
                ? source`import type { Signer } from "@polkadot/api/types";
        import { TypeRegistry } from "@polkadot/types/create";
        import { hexToU8a, u8aToHex } from "@polkadot/util";
        import type { TPjsSigner } from "@paraspell/sdk-pjs";
        `
                : ''
            }`
      }${renderFragment('node/substrate-keyring')}
        ${
          client === 'pjs'
            ? source`
        const typeRegistry = new TypeRegistry();
        
        const keyringPairToPjsSigner = (pair: KeyringPair): TPjsSigner => {
          const signer = {
            signRaw: async (raw) => ({
              id: 1,
              signature: u8aToHex(signBytes(pair, hexToU8a(raw.data))),
            }),
            signPayload: async (payload) => {
              const { signature } = typeRegistry
                .createType("ExtrinsicPayload", payload, { version: payload.version })
                .sign(pair);
        
              return { id: 1, signature };
            },
          } satisfies Signer;
        
          return { address: pair.address, signer };
        };
        `
            : ''
        }
        
        export const getSubstrateSigner = async (): Promise<${
          client === 'papi'
            ? 'PolkadotSigner'
            : client === 'pjs'
              ? 'TPjsSigner'
              : 'KeyringPair'
        }> => {
          const pair = createKeyringPair(getSubstrateMnemonic());
        ${
          client === 'papi'
            ? source`
          return getPolkadotSigner(
            pair.publicKey,
            "Sr25519",
            (input) => signBytes(pair, input),
          );
        `
            : source`${
                client === 'pjs'
                  ? source`
          return keyringPairToPjsSigner(pair);
        `
                  : source`
          return pair;
        `
              }`
        }
        };
        `,
    },
    {
      path: 'src/transfer.ts',
      render: () => source`${
        swap
          ? source`import "@paraspell/swap";
        `
          : ''
      }import {
          Builder,
          findAssetInfoOrThrow,
          findNativeAssetInfoOrThrow,
          ${
            swap
              ? source`getSupportedAssets,
          `
              : ''
          }
          assertToIsString,${
            client !== 'papi' && !swap
              ? source`
          createChainClient,`
              : ''
          }${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "${sdkPackage}";${
          (client === 'pjs' || client === 'dedot') && !swap
            ? source`
        import { assertSubstrateOrigin } from "./isEvmOrigin.js";`
            : ''
        }${
          evmWallet && swap
            ? source`
        import { getEvmWalletClient } from "./evm.js";`
            : ''
        }${
          evmWallet && !swap
            ? source`
        import { submitEvmTransfer } from "./evm.js";`
            : ''
        }
        import { getSubstrateSigner } from "./substrate.js";
        import type { TChain, TDestination, TLocation } from "${sdkPackage}";
        import type { TTransferParams } from "./types.js";
        
        const defaults: TTransferParams = {
          from: "${snowbridge ? 'Ethereum' : evm ? 'Moonbeam' : 'Astar'}",
          to: "Hydration",
          amount: "0.1",
          recipient: "//Bob",
        };
        
        const resolveCurrencyLocation = async (
          from: TChain,
          to: TDestination,
          location?: TLocation,
        ) => {
          if (location) {
            assertToIsString(to);
            findAssetInfoOrThrow(from, { location }, to);
            return location;
          }
          return findNativeAssetInfoOrThrow(from).location;
        };
        
        ${
          swap
            ? source`const resolveCurrencyToLocation = async (
          from: TChain,
          to: TDestination,
          location?: TLocation,
        ) => {
          assertToIsString(to);
          if (location) {
            findAssetInfoOrThrow(from, { location }, to);
            return location;
          }
          const assets = await getSupportedAssets(from, to);
          const targetSymbol = "${evm ? 'USDC' : 'DOT'}";
          const asset = assets.find((entry) => entry.symbol === targetSymbol);
          if (!asset) {
            throw new Error(
              \`Asset \${targetSymbol} not found for \${from} -> \${to}\`,
            );
          }
          return asset.location;
        };
        
        `
            : ''
        }export const transferAsset = async (): Promise<string | string[]> => {
          const opts = defaults;
          const currencyLocation = await resolveCurrencyLocation(
            opts.from,
            opts.to,
            opts.currencyLocation,
          );
        
        ${
          swap
            ? source`  const currencyToLocation = await resolveCurrencyToLocation(
            opts.from,
            opts.to,
            opts.currencyToLocation,
          );
        
          ${
            evmWallet
              ? source`const swapSender = isChainEvm(opts.from)
            ? getEvmWalletClient(opts.from)
            : await getSubstrateSigner();
          `
              : source`const swapSender = await getSubstrateSigner();
          `
          }
          const swapBuilder = Builder()
            .from(opts.from)
            .to(opts.to)
            .currency({
              location: currencyLocation,
              amount: opts.amount,
            })
            .recipient(opts.recipient)
            .sender(swapSender)
            .swap({
              currencyTo: { location: currencyToLocation },
            });
        
          return await swapBuilder.signAndSubmitAll();
        
        `
            : source`${
                evmWallet
                  ? source`  if (isChainEvm(opts.from)) {
            return await submitEvmTransfer({
              ...opts,
              currencyLocation,
            });
          }
        
        `
                  : ''
              }  const sender = await getSubstrateSigner();
        ${
          client === 'papi'
            ? source`
          const builder = Builder()
            .from(opts.from)
            .to(opts.to)
            .currency({
              location: currencyLocation,
              amount: opts.amount,
            })
            .recipient(opts.recipient)
            .sender(sender);
        `
            : source`
          assertSubstrateOrigin(opts.from);
          const client = await createChainClient(opts.from);
          const builder = Builder(client)
            .from(opts.from)
            .to(opts.to)
            .currency({
              location: currencyLocation,
              amount: opts.amount,
            })
            .recipient(opts.recipient)
            .sender(sender);
        `
        }
        
          return await builder.signAndSubmit();
        `
        }
        };
        `,
    },
    {
      path: 'src/types.ts',
      render: () => source`${renderFragment('types/sdk.node')}
        `,
    },
    {
      path: 'tsconfig.json',
      render: () => source`{
          "compilerOptions": {
            "target": "ES2022",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
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
