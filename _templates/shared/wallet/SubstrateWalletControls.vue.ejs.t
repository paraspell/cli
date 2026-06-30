<script setup lang="ts">
import type { WalletAccountOption } from "../../types";

defineProps<{
  extensionNames: string[];
  selectedExtensionName: string | undefined;
  accounts: WalletAccountOption[];
  selectedAddress: string | undefined;
}>();

const emit = defineEmits<{
  connectClick: [];
  extensionChange: [name: string];
  accountChange: [address: string];
}>();

const onExtensionChange = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;

  const name = target.value;
  if (name) emit("extensionChange", name);
};

const onAccountChange = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;

  emit("accountChange", target.value);
};
</script>

<template>
  <div v-if="extensionNames.length > 0">
    <h4>Select extension:</h4>
    <select
      :value="selectedExtensionName"
      @change="onExtensionChange"
    >
      <option
        disabled
        value=""
      >
        -- select an option --
      </option>
      <option
        v-for="name in extensionNames"
        :key="name"
        :value="name"
      >
        {{ name }}
      </option>
    </select>
  </div>
  <button
    v-else
    type="button"
    @click="emit('connectClick')"
  >
    Connect Wallet
  </button>

  <div v-if="accounts.length > 0">
    <h4>Select account:</h4>
    <select
      :value="selectedAddress"
      @change="onAccountChange"
    >
      <option
        v-for="{ name, address } in accounts"
        :key="address"
        :value="address"
      >
        {{ name }} — {{ address }}
      </option>
    </select>
  </div>
</template>
