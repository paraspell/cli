<script setup lang="ts">
import { parseWalletKind, WALLET_KIND_OPTIONS } from "../../types";
import type { WalletKind } from "../../types";

defineProps<{
  activeWalletKind: WalletKind;
}>();

const emit = defineEmits<{
  "update:activeWalletKind": [kind: WalletKind];
}>();

const onWalletKindChange = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;

  emit("update:activeWalletKind", parseWalletKind(target.value));
};
</script>

<template>
  <div>
    <h4>Select wallet type:</h4>
    <select :value="activeWalletKind" @change="onWalletKindChange">
      <option
        v-for="{ value, label } in WALLET_KIND_OPTIONS"
        :key="value"
        :value="value"
      >
        {{ label }}
      </option>
    </select>
  </div>
</template>
