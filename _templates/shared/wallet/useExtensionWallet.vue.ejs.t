import { computed, ref, watch } from "vue";
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
  const extensionNames = ref<string[]>([]);
  const selectedExtensionName = ref<string>();
  const accounts = ref<WalletAccountOption[]>([]);
  const selectedAddress = ref<string>();
  const signer = ref<Signer | null>(null);

  const selectExtension = async (name: string) => {
    await web3Enable(DAPP_ORIGIN);
    const filtered = await web3Accounts({ extensions: [name] });
    const nextAccounts = filtered.map(
      (account): WalletAccountOption => ({
        address: account.address,
        name: account.meta.name,
      }),
    );
    selectedExtensionName.value = name;
    accounts.value = nextAccounts;
    selectedAddress.value = nextAccounts[0]?.address;
  };

  const discoverExtensions = async () => {
    const injected = await web3Enable(DAPP_ORIGIN);
    if (!injected.length) {
      alert(
        "No Polkadot{.js} extension responded. Install a compatible wallet.",
      );
      return;
    }
    const names = injected.map((e) => e.name);
    extensionNames.value = names;
    await selectExtension(names[0]);
  };

  watch(selectedAddress, (address) => {
    if (!address) return;
    void web3Enable(DAPP_ORIGIN);
  });

  watch(
    selectedAddress,
    (address, _, onCleanup) => {
      if (!address) return;
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
        signer.value = null;
      });
      void web3FromAddress(address)
        .then((injector) => {
          if (!cancelled) signer.value = injector.signer;
        })
        .catch(() => {
          if (!cancelled) signer.value = null;
        });
    },
    { immediate: true },
  );

  const connection = computed((): SubstrateWalletConnection<Signer> | null => {
    if (!selectedAddress.value || !signer.value) return null;
    return { address: selectedAddress.value, signer: signer.value };
  });

  const selectAccountByAddress = (address: string) => {
    const acc = accounts.value.find((a) => a.address === address);
    if (acc) selectedAddress.value = acc.address;
  };

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
