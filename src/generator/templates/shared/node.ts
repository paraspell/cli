import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TNodeFragmentId = Extract<TFragmentId, `node/${string}`>;

export const createNodeFragments: TFragmentFactory<TNodeFragmentId> = (
  context,
  renderFragment,
) => {
  const { client, projectKind } = context;
  const transferFunction =
    projectKind === 'sdk' ? 'transferAsset' : 'transferViaApi';

  return {
    'node/getEvmWalletClient': () => source`import {
          createWalletClient,
          http,
          isHex,
        } from "viem";
        import { privateKeyToAccount } from "viem/accounts";
        import { getViemChainForOrigin } from "./getViemChain.js";
        
        export const getEvmWalletClient = (origin: string) => {
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
    'node/server': () => source`import "dotenv/config";
        ${projectKind === 'sdk' ? renderFragment('paraspell-side-effects') : ''}import express from "express";
        import { ${transferFunction} } from "./transfer.js";

        const app = express();
        app.use(express.json());

        app.post("/", async (_req, res) => {
          try {
            const result = await ${transferFunction}();
            res.status(200).json({ success: true, result });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            res.status(500).json({ success: false, error: message });
          }
        });

        const port = Number(process.env.PORT ?? 3000);
        app.listen(port, () => {
          console.log(\`Server listening on http://localhost:\${port}\`);
          console.log("POST / to submit the configured XCM transfer.");
        });
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
    'node/tsconfig': () => source`{
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
  };
};
