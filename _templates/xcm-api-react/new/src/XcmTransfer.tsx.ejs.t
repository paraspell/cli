---
to: src/XcmTransfer.tsx
---
import { useCallback, useState, type FC } from "react";
import TransferForm from "./XcmTransferForm";
import type { FormValues } from "./types";
<% if (evmWallet) { %>
import {
  useWallet,
  WalletControls,
  WalletKindSelector,
} from "./wallet/papi";
<% } else { %>
import { SubstrateWalletControls, usePapiWallet } from "./wallet/papi";
import { submitUsingApi } from "./submit/submitUsingApi";
<% } -%>

<%- h.includeShared('shared/spa/toError.ejs.t') %>
const XcmTransfer: FC = () => {
  const [errorVisible, setErrorVisible] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  <% if (evmWallet) { %>
  const wallet = useWallet();
  const [originChain, setOriginChain] = useState("Astar");

  const handleOriginChange = useCallback(
    (origin: string) => {
      setOriginChain(origin);
    },
    [],
  );

  const setWalletKind = useCallback(
    (kind: typeof wallet.activeWalletKind) => {
      wallet.setActiveWalletKind(kind);
    },
    [wallet],
  );
  <% } else { %>
  const wallet = usePapiWallet();
  const [originChain, setOriginChain] = useState("Astar");

  const handleOriginChange = useCallback((origin: string) => {
    setOriginChain(origin);
  }, []);
  <% } %>

  const onSubmit = async (formValues: FormValues) => {
    setLoading(true);
    setErrorVisible(false);

    try {
      <% if (evmWallet) { %>
      const submitted = await wallet.submitTransfer(formValues);
      if (!submitted) return;
      <% } else { %>
      if (!wallet.connection) {
        alert("No account selected, connect wallet first");
        return;
      }

      await submitUsingApi(
        formValues,
        wallet.connection.signer,
        wallet.connection.address,
      );
      <% } %>
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
        onExtensionChange={(name) => {
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
