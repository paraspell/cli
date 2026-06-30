---
to: src/substrate.ts
---
<% if (client === 'papi') { -%>
import { getPolkadotSigner } from "polkadot-api/signer";
import type { PolkadotSigner } from "polkadot-api";
<% } else if (client === 'pjs') { -%>
import type { Signer } from "@polkadot/api/types";
import { TypeRegistry } from "@polkadot/types/create";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import type { TPjsSigner } from "@paraspell/sdk-pjs";
<% } -%>
<%- h.includeShared('shared/node/substrate-keyring.ejs.t') %>
<% if (client === 'pjs') { %>
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
<% } %>

export const getSubstrateSigner = async (): Promise<<%= client === 'papi' ? 'PolkadotSigner' : client === 'pjs' ? 'TPjsSigner' : 'KeyringPair' %>> => {
  const pair = createKeyringPair(getSubstrateMnemonic());
<% if (client === 'papi') { %>
  return getPolkadotSigner(
    pair.publicKey,
    "Sr25519",
    (input) => signBytes(pair, input),
  );
<% } else if (client === 'pjs') { %>
  return keyringPairToPjsSigner(pair);
<% } else { %>
  return pair;
<% } %>
};
