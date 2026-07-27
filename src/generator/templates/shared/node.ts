import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TNodeFragmentId = Extract<TFragmentId, `node/${string}`>;

export const createNodeFragments: TFragmentFactory<TNodeFragmentId> = (
  context,
) => {
  const { client, projectKind } = context;

  return {
    'node/getEvmSenderAddress':
      () => source`export const getEvmSenderAddress = (origin: string): string => {
          const walletClient = getEvmWalletClient(origin);
          const account = walletClient.account;
          if (!account) {
            throw new Error("EVM wallet client has no account configured.");
          }
          return account.address;
        };
        `,
    'node/getEvmWalletClient': () => source`import {
          createWalletClient,
          http,
          isHex,
          type WalletClient,
        } from "viem";
        import { privateKeyToAccount } from "viem/accounts";
        import { getViemChainForOrigin } from "./getViemChain.js";
        
        export const getEvmWalletClient = (origin: string): WalletClient => {
          const privateKey = process.env.PRIVATE_KEY;
          if (!privateKey) {
            throw new Error(
              "PRIVATE_KEY env var is required for EVM transfers (0x-prefixed hex).",
            );
          }
        
          if (!isHex(privateKey)) {
            throw new Error("PRIVATE_KEY must be a 0x-prefixed hex string.");
          }
        
          const account = privateKeyToAccount(privateKey);
          return createWalletClient({
            account,
            chain: getViemChainForOrigin(origin),
            transport: http(),
          });
        };
        `,
    'node/substrate-keyring':
      () => source`import { Keyring } from "@polkadot/keyring";
        import type { KeyringPair } from "@polkadot/keyring/types";
        
        ${projectKind === 'api' ? 'export ' : ''}const getSubstrateMnemonic = (): string => {
          const secret = process.env.SUBSTRATE_MNEMONIC;
          if (!secret) {
            throw new Error(
              "SUBSTRATE_MNEMONIC env var is required for Substrate transfers (mnemonic or //Dev URI).",
            );
          }
          return secret;
        };
        
        const createKeyringPair = (secret: string): KeyringPair => {
          const keyring = new Keyring({ type: "sr25519" });
          try {
            if (secret.startsWith("//")) {
              return keyring.addFromUri(secret);
            }
            if (secret.includes(" ")) {
              return keyring.addFromMnemonic(secret);
            }
            return keyring.addFromUri(secret);
          } catch {
            throw new Error(
              "SUBSTRATE_MNEMONIC must be a BIP39 mnemonic (quote it in .env) or a //Dev URI like //Alice.",
            );
          }
        };
        
        ${
          client !== 'dedot'
            ? source`const signBytes = (pair: KeyringPair, input: Uint8Array): Uint8Array =>
          Uint8Array.from(pair.sign(input));`
            : ''
        }
        `,
  };
};
