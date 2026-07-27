import type { TTemplateContext, TTemplateFile } from '../types.js';
import { createFragmentFile } from './fragment-file.js';
import type { TFragmentRenderer } from './shared/fragment-types.js';
import { source } from './source.js';

export const createXcmSdkNodeTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const {
    client,
    sdkPackage,
    extensions: { evm, swap },
    evmWallet,
    defaultOriginChain,
  } = context;
  const fragment = createFragmentFile(renderFragment);

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
    fragment('src/getViemChain.ts', 'evm/getViemChain', !evmWallet),
    fragment('src/index.ts', 'node/server'),
    fragment(
      'src/isEvmOrigin.ts',
      'evm/isEvmOrigin.sdk',
      client === 'papi' || swap,
    ),
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
          from: "${defaultOriginChain}",
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
    fragment('src/types.ts', 'types/sdk.node'),
    fragment('tsconfig.json', 'node/tsconfig'),
  ];
};
