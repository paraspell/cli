---
to: src/substrate.ts
---
import { Binary } from "polkadot-api";
import { getPolkadotSigner } from "polkadot-api/signer";
<%- h.includeShared('shared/node/substrate-keyring.ejs.t') %>

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
