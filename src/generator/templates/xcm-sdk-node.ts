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
    extensions: { swap },
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
        export const submitEvmTransfer = (
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
        
          return Builder()
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
        
        export const getSubstrateSigner = (): ${
          client === 'papi'
            ? 'PolkadotSigner'
            : client === 'pjs'
              ? 'TPjsSigner'
              : 'KeyringPair'
        } => {
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
          findNativeAssetInfoOrThrow,${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "${sdkPackage}";${
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
        import type { TTransferParams } from "./types.js";
        
        const defaults: TTransferParams = {
          from: "${defaultOriginChain}",
          to: "Hydration",
          amount: "0.1",
          recipient: "//Bob",
        };
        
        export const transferAsset = async (): Promise<string | string[]> => {
          const opts = defaults;
          const currencyLocation =
            opts.currencyLocation ?? findNativeAssetInfoOrThrow(opts.from).location;
        
        ${
          swap
            ? source`  const { currencyToLocation } = opts;
          if (!currencyToLocation) {
            throw new Error(
              "Configure currencyToLocation in defaults when swap is enabled.",
            );
          }
        
          ${
            evmWallet
              ? source`const swapSender = isChainEvm(opts.from)
            ? getEvmWalletClient(opts.from)
            : getSubstrateSigner();
          `
              : source`const swapSender = getSubstrateSigner();
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
        
          return swapBuilder.signAndSubmitAll();
        
        `
            : source`${
                evmWallet
                  ? source`  if (isChainEvm(opts.from)) {
            return submitEvmTransfer({
              ...opts,
              currencyLocation,
            });
          }
        
        `
                  : ''
              }  const sender = getSubstrateSigner();
          const builder = Builder()
            .from(opts.from)
            .to(opts.to)
            .currency({
              location: currencyLocation,
              amount: opts.amount,
            })
            .recipient(opts.recipient)
            .sender(sender);
        
          return builder.signAndSubmit();
        `
        }
        };
        `,
    },
    fragment('src/types.ts', 'types/sdk.node'),
    fragment('tsconfig.json', 'node/tsconfig'),
  ];
};
