import type { TTemplateContext, TTemplateFile } from '../types.js';
import type { TFragmentRenderer } from './shared/contracts.js';
import { source } from './source.js';

export const createXcmSdkNodeTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    projectName,
    packageManager,
    installCmd,
    startCmd,
    client,
    sdkPackage,
    sdkVersion,
    clientLabel,
    extensions: { evm, swap, snowbridge },
    evmWallet,
    polkadotApi,
    polkadotKeyring,
    polkadotUtil,
    polkadotUtilCrypto,
    dotenv,
    express,
    viem,
    polkadotJsApi,
    dedot,
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
      render: () => source`# ParaSpell XCM SDK — Node.js example
        
        Headless example using **${clientLabel}** (\`${sdkPackage}\`) with \`signAndSubmit()\`.
        
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
        
        Default route: \`${snowbridge ? 'Ethereum' : evm ? 'Moonbeam' : 'Astar'}\` → \`Hydration\` — edit \`src/transfer.ts\` to customize.

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
        
        - [Send XCM](https://paraspell.github.io/docs/xcm-sdk/send-xcm.html)
        - [Getting started](https://paraspell.github.io/docs/xcm-sdk/getting-started.html)
        
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
            "${sdkPackage}": "${sdkVersion}"${
              client === 'papi'
                ? source`,
            "@paraspell/descriptors": "${sdkVersion}"`
                : ''
            },
            "@polkadot/keyring": "${polkadotKeyring}",
            "@polkadot/util-crypto": "${polkadotUtilCrypto}",
            "dotenv": "${dotenv}",
            "express": "${express}"${
              swap
                ? source`,
            "@paraspell/swap": "${sdkVersion}"`
                : ''
            }${
              evm
                ? source`,
            "@paraspell/evm": "${sdkVersion}"`
                : ''
            }${
              evmWallet
                ? source`,
            "viem": "${viem}"`
                : ''
            }${
              snowbridge
                ? source`,
            "@paraspell/evm-snowbridge": "${sdkVersion}"`
                : ''
            }${
              client === 'papi'
                ? source`,
            "polkadot-api": "${polkadotApi}"`
                : ''
            }${
              client === 'pjs'
                ? source`,
            "@polkadot/api": "${polkadotJsApi}",
            "@polkadot/types": "${polkadotJsApi}",
            "@polkadot/util": "${polkadotUtil}"`
                : ''
            }${
              client === 'dedot'
                ? source`,
            "dedot": "${dedot}"`
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
      path: 'src/evm.ts',
      skip: Boolean(!evmWallet),
      render: () => source`import {
          Builder,
          isChainEvm,
        } from "${sdkPackage}";
        import type { TTransferParams } from "./types.js";
        ${renderFragment('node/getEvmWalletClient')}
        
        export { assertSubstrateOrigin } from "./isEvmOrigin.js";
        
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
      skip: false,
      render: () => source`${renderFragment('evm/isEvmOrigin.sdk')}
        `,
    },
    {
      path: 'src/substrate.ts',
      skip: false,
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
      skip: false,
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
      skip: false,
      render: () => source`${renderFragment('types/sdk.node')}
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
