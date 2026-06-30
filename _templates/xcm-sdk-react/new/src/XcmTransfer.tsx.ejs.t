---
to: src/XcmTransfer.tsx
---
import { useCallback, useState, type FC } from "react";
import TransferForm from "./XcmTransferForm";
import type { FormValues } from "./types";
import type { TChain } from "<%= sdkPackage %>";
import {
  <% if (evmWallet) { %>useWallet,
  WalletControls,
  WalletKindSelector,<% } else { %>
  use<%= client === 'pjs' ? 'Pjs' : client === 'papi' ? 'Papi' : 'Dedot' %>Wallet,
  SubstrateWalletControls,<% } %>
} from "./wallet/<%= clientDir %>";<% if (!evmWallet) { %>
import { submitUsingSdk } from "./xcm/<%= client %>";<% } -%>

<%- h.includeShared('shared/spa/toError.ejs.t') %>
const XcmTransfer: FC = () => {
  const [errorVisible, setErrorVisible] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  <% if (evmWallet) { %>const wallet = useWallet();<% } else if (client === 'pjs') { %>const wallet = usePjsWallet();<% } else if (client === 'papi') { %>const wallet = usePapiWallet();<% } else { %>const wallet = useDedotWallet();<% } %>
  const [originChain, setOriginChain] = useState<TChain>("Astar");

  <% if (evmWallet) { %>const handleOriginChange = useCallback((origin: TChain) => {
    setOriginChain(origin);
  }, []);

  const setWalletKind = useCallback(
    (kind: typeof wallet.activeWalletKind) => {
      wallet.setActiveWalletKind(kind);
    },
    [wallet],
  );<% } else { %>const handleOriginChange = useCallback((origin: TChain) => {
    setOriginChain(origin);
  }, []);<% } %>

  const onSubmit = async (formValues: FormValues) => {
    setLoading(true);
    setErrorVisible(false);

    try {
      <% if (evmWallet) { %>const submitted = await wallet.submitTransfer(formValues);
      if (!submitted) return;<% } else { %>if (!wallet.connection) {
        alert("No account selected, connect wallet first");
        return;
      }

      await submitUsingSdk(
        formValues,
        wallet.connection.signer,
        wallet.connection.address,
      );<% } %>
      alert("Transaction was successful!");
    } catch (error) {
      setError(toError(error));
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transferLayout">
      <% if (evmWallet) { %>
      <div className="formHeader">
        <WalletKindSelector
          activeWalletKind={wallet.activeWalletKind}
          setActiveWalletKind={setWalletKind}
        />
        <WalletControls wallet={wallet} />
      </div>
      <% } else { %>
      <div className="formHeader">
      <SubstrateWalletControls
        extensionNames={wallet.extensionNames}
        selectedExtensionName={wallet.selectedExtensionName}
        accounts={wallet.accounts}
        selectedAddress={wallet.selectedAddress}
        onConnectClick={() => {
          void wallet.discoverExtensions();
        }}
        onExtensionChange={(name: string) => {
          void wallet.selectExtension(name);
        }}
        onAccountChange={wallet.selectAccountByAddress}
      />
      </div>
      <% } %>
      <TransferForm
        onSubmit={onSubmit}
        loading={loading}
        originChain={originChain}
        onOriginChange={handleOriginChange}
      />
      {errorVisible && <p className="transferError">{error?.message}</p>}
    </div>
  );
};

export default XcmTransfer;
