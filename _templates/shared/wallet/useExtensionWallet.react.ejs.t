import { useCallback, useEffect, useMemo, useState } from "react";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import type { Signer } from "@polkadot/api/types";
import type {
  SubstrateWalletConnection,
  WalletAccountOption,
} from "../../types";

const DAPP_ORIGIN = "ParaSpell XCM SDK";

export const use<%= client === 'pjs' ? 'Pjs' : 'Dedot' %>Wallet = () => {
  const [extensionNames, setExtensionNames] = useState<string[]>([]);
  const [selectedExtensionName, setSelectedExtensionName] = useState<string>();
  const [accounts, setAccounts] = useState<WalletAccountOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>();
  const [signer, setSigner] = useState<Signer | null>(null);

  const selectExtension = useCallback(async (name: string) => {
    await web3Enable(DAPP_ORIGIN);
    const filtered = await web3Accounts({ extensions: [name] });
    const nextAccounts = filtered.map(
      (account): WalletAccountOption => ({
        address: account.address,
        name: account.meta.name,
      }),
    );
    setSelectedExtensionName(name);
    setAccounts(nextAccounts);
    if (nextAccounts[0]) {
      setSelectedAddress(nextAccounts[0].address);
    } else {
      setSelectedAddress(undefined);
    }
  }, []);

  const discoverExtensions = useCallback(async () => {
    const injected = await web3Enable(DAPP_ORIGIN);
    if (!injected.length) {
      alert(
        "No Polkadot{.js} extension responded. Install a compatible wallet.",
      );
      return;
    }
    const names = injected.map((e) => e.name);
    setExtensionNames(names);
    await selectExtension(names[0]);
  }, [selectExtension]);

  useEffect(() => {
    if (!selectedAddress) {
      return;
    }
    void web3Enable(DAPP_ORIGIN);
  }, [selectedAddress]);

  useEffect(() => {
    if (!selectedAddress) {
      return;
    }
    let cancelled = false;
    void web3FromAddress(selectedAddress)
      .then((injector) => {
        if (cancelled) return;
        setSigner(injector.signer);
      })
      .catch(() => {
        if (!cancelled) setSigner(null);
      });
    return () => {
      cancelled = true;
      setSigner(null);
    };
  }, [selectedAddress]);

  const connection = useMemo((): SubstrateWalletConnection<Signer> | null => {
    if (!selectedAddress || !signer) return null;
    return { address: selectedAddress, signer };
  }, [selectedAddress, signer]);

  const selectAccountByAddress = useCallback(
    (address: string) => {
      const acc = accounts.find((a) => a.address === address);
      if (acc) setSelectedAddress(acc.address);
    },
    [accounts],
  );

  return {
    extensionNames,
    selectedExtensionName,
    accounts,
    selectedAddress,
    connection,
    discoverExtensions,
    selectExtension,
    selectAccountByAddress,
  };
};
