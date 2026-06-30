---
to: src/XcmTransfer.vue
---
<script setup lang="ts">
import { ref } from "vue";
import TransferForm from "./XcmTransferForm.vue";
import type { FormValues } from "./types";
<% if (evmWallet) { %>
import {
  useWallet,
  WalletControls,
  WalletKindSelector,
} from "./wallet/papi";
<% } else { %>
import { usePapiWallet, SubstrateWalletControls } from "./wallet/papi";
import { submitUsingApi } from "./submit/submitUsingApi";
<% } -%>

<%- h.includeShared('shared/spa/toError.ejs.t') %>
const errorVisible = ref(false);
const error = ref<Error | null>(null);
const loading = ref(false);
const originChain = ref("Astar");

const handleOriginChange = (origin: string) => {
  originChain.value = origin;
};

<% if (evmWallet) { %>
const wallet = useWallet();

const setWalletKind = (kind: typeof wallet.activeWalletKind.value) => {
  wallet.setActiveWalletKind(kind);
};
<% } else { %>
const {
  extensionNames,
  selectedExtensionName,
  accounts,
  selectedAddress,
  connection,
  discoverExtensions,
  selectExtension,
  selectAccountByAddress,
} = usePapiWallet();
<% } -%>

const onSubmit = async (formValues: FormValues) => {
  loading.value = true;
  errorVisible.value = false;

  try {
    <% if (evmWallet) { %>
    const submitted = await wallet.submitTransfer(formValues);
    if (!submitted) return;
    <% } else { %>
    if (!connection.value) {
      alert("No account selected, connect wallet first");
      return;
    }

    await submitUsingApi(
      formValues,
      connection.value.signer,
      connection.value.address,
    );
    <% } %>
    alert("Transaction was successful!");
  } catch (e) {
    error.value = toError(e);
    errorVisible.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="transferLayout">
    <% if (evmWallet) { %>
    <div class="formHeader">
      <WalletKindSelector
        :active-wallet-kind="wallet.activeWalletKind.value"
        @update:active-wallet-kind="setWalletKind"
      />
      <WalletControls :wallet="wallet" />
    </div>
    <% } else { %>
    <div class="formHeader">
    <SubstrateWalletControls
      :extension-names="extensionNames"
      :selected-extension-name="selectedExtensionName"
      :accounts="accounts"
      :selected-address="selectedAddress"
      @connect-click="() => { void discoverExtensions(); }"
      @extension-change="(name: string) => { void selectExtension(name); }"
      @account-change="selectAccountByAddress"
    />
    </div>
    <% } %>
    <TransferForm
      :loading="loading"
      :origin-chain="originChain"
      @origin-change="handleOriginChange"
      @submit="onSubmit"
    />
    <p
      v-if="errorVisible"
      class="transferError"
    >
      {{ error?.message }}
    </p>
  </div>
</template>
