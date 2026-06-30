import { useCallback, useMemo, useState } from "react";
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
  type InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer";
import type { PolkadotSigner } from "polkadot-api";
import type { SubstrateWalletConnection } from "../../types";

export const usePapiWallet = () => {
  const [extensionNames, setExtensionNames] = useState<string[]>([]);
  const [selectedExtension, setSelectedExtension] =
    useState<InjectedExtension | null>(null);
  const [accounts, setAccounts] = useState<InjectedPolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedPolkadotAccount>();

  const connection = useMemo((): SubstrateWalletConnection<PolkadotSigner> | null => {
    if (!selectedAccount) return null;
    return {
      address: selectedAccount.address,
      signer: selectedAccount.polkadotSigner,
    };
  }, [selectedAccount]);

  const selectExtension = useCallback(async (name: string) => {
    const injected = await connectInjectedExtension(name);
    setSelectedExtension(injected);
    const nextAccounts = injected.getAccounts();
    setAccounts(nextAccounts);
    if (nextAccounts.length > 0) setSelectedAccount(nextAccounts[0]);
    else setSelectedAccount(undefined);
  }, []);

  const discoverExtensions = useCallback(async () => {
    const names = getInjectedExtensions();
    if (names.length === 0) {
      alert("No wallet extension found, install it to connect");
      throw new Error("No Wallet Extension Found!");
    }
    setExtensionNames(names);
    await selectExtension(names[0]);
  }, [selectExtension]);

  const selectAccountByAddress = useCallback(
    (address: string) => {
      const acc = accounts.find((a) => a.address === address);
      if (acc) setSelectedAccount(acc);
    },
    [accounts],
  );

  return {
    extensionNames,
    selectedExtensionName: selectedExtension?.name,
    selectedExtension,
    accounts,
    selectedAddress: selectedAccount?.address,
    selectedAccount,
    connection,
    discoverExtensions,
    selectExtension,
    selectAccountByAddress,
  };
};
