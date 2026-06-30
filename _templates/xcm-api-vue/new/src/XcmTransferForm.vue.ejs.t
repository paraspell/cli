---
to: src/XcmTransferForm.vue
---
<script setup lang="ts">
import axios from "axios";
import { ref, computed, watch, onMounted } from "vue";
import { API_URL } from "./consts";
import type { AssetInfo, FormValues } from "./types";<% if (swap) { %>
import { useExchangeChains } from "./swap";<% } %>

const props = defineProps<{
  loading: boolean;
  originChain: string;
}>();

const emit = defineEmits<{
  submit: [values: FormValues];
  originChange: [origin: string];
}>();

const chains = ref<string[]>([]);
const destinationChain = ref("Hydration");
const supportedAssets = ref<AssetInfo[]>([]);
const currencyOptionId = ref("");
<% if (swap) { %>const supportedSwapAssets = ref<AssetInfo[]>([]);
const currencyToOptionId = ref("");
const swapEnabled = ref(false);
const exchange = ref<string[]>([]);
const AUTO_EXCHANGE_VALUE = "";
const exchangeSelectValue = computed(() =>
  exchange.value.length > 0 ? exchange.value : [AUTO_EXCHANGE_VALUE],
);
const { chains: exchangeChains } = useExchangeChains();
const exchangeSelectSize = computed(() => exchangeChains.value.length + 1);
<% } %>const recipient = ref(
  "5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96",
);
const amount = ref("5");

const fetchChains = async () => {
  const response = await axios.get<string[]>(`${API_URL}/chains`);
  chains.value = response.data;
};

onMounted(() => {
  void fetchChains();
});

watch(
  [() => props.originChain, destinationChain],
  async () => {
    const response = await axios.get<AssetInfo[]>(
      `${API_URL}/supported-assets?origin=${props.originChain}&destination=${destinationChain.value}`,
    );
    supportedAssets.value = response.data;
  },
  { immediate: true },
);

<% if (swap) { %>watch(
  [() => props.originChain, destinationChain, swapEnabled],
  async () => {
    if (!swapEnabled.value) {
      supportedSwapAssets.value = [];
      return;
    }

    const response = await axios.get<AssetInfo[]>(
      `${API_URL}/supported-assets?origin=${destinationChain.value}&destination=${props.originChain}`,
    );
    supportedSwapAssets.value = response.data;
  },
  { immediate: true },
);

<% } %>
const currencyMap = computed(() =>
  supportedAssets.value.reduce(
    (map: Record<string, AssetInfo>, asset: AssetInfo) => {
      const key = `${asset.symbol ?? "NO_SYMBOL"}-${JSON.stringify(asset.location)}`;
      map[key] = asset;
      return map;
    },
    {},
  ),
);

const currencyOptions = computed(() =>
  Object.keys(currencyMap.value).map((key) => ({
    value: key,
    label: `${currencyMap.value[key].symbol ?? "Unknown"} - ${currencyMap.value[key].assetId ?? "Location"}`,
  })),
);

watch(
  currencyOptions,
  (opts) => {
    if (opts.length > 0) {
      currencyOptionId.value = opts[opts.length - 1].value;
    }
  },
  { immediate: true },
);

<% if (swap) { %>const currencyToMap = computed(() =>
  supportedSwapAssets.value.reduce(
    (map: Record<string, AssetInfo>, asset: AssetInfo) => {
      const key = `${asset.symbol ?? "NO_SYMBOL"}-${JSON.stringify(asset.location)}`;
      map[key] = asset;
      return map;
    },
    {},
  ),
);

const currencyToOptions = computed(() =>
  Object.keys(currencyToMap.value).map((key) => ({
    value: key,
    label: `${currencyToMap.value[key].symbol ?? "Unknown"} - ${currencyToMap.value[key].assetId ?? "Location"}`,
  })),
);

watch(
  currencyToOptions,
  (opts) => {
    if (opts.length > 0) {
      currencyToOptionId.value = opts[opts.length - 1].value;
    }
  },
  { immediate: true },
);

const onExchangeChange = (e: Event) => {
  const target = e.target;
  if (!(target instanceof HTMLSelectElement)) return;

  const selected = Array.from(target.selectedOptions, (o) => o.value);
  const exchanges = selected.filter((value) => value !== AUTO_EXCHANGE_VALUE);
  exchange.value = exchanges.length > 0 ? exchanges : [];
};

<% } %>
const onOriginSelect = (e: Event) => {
  const target = e.target;
  if (!(target instanceof HTMLSelectElement)) return;
  emit("originChange", target.value);
};

const handleSubmit = (e: Event) => {
  e.preventDefault();
  const currency = currencyMap.value[currencyOptionId.value];
  if (!currency) return;
<% if (swap) { %>
  const selectedCurrencyTo = swapEnabled.value
    ? currencyToMap.value[currencyToOptionId.value]
    : undefined;
  if (swapEnabled.value && !selectedCurrencyTo) return;
<% } %>
  emit("submit", {
    from: props.originChain,
    to: destinationChain.value,
    recipient: recipient.value,
    amount: amount.value,
    currency,<% if (swap) { %>
    swapEnabled: swapEnabled.value,
    currencyTo: selectedCurrencyTo,
    exchange: swapEnabled.value ? exchange.value : undefined,<% } %>
  });
};
</script>

<template>
  <form @submit="handleSubmit">
    <label>
      Origin chain
      <select
        :value="originChain"
        required
        :disabled="loading"
        @change="onOriginSelect"
      >
        <option
          v-for="chain in chains"
          :key="chain"
          :value="chain"
        >
          {{ chain }}
        </option>
      </select>
    </label>

    <label>
      Destination chain
      <select
        v-model="destinationChain"
        required
        :disabled="loading"
      >
        <option
          v-for="chain in chains"
          :key="chain"
          :value="chain"
        >
          {{ chain }}
        </option>
      </select>
    </label>

    <label>
      Currency
      <select
        v-model="currencyOptionId"
        required
      >
        <option
          v-for="option in currencyOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <label>
      Recipient address
      <input
        v-model="recipient"
        type="text"
        required
      >
    </label>

    <label>
      Amount
      <input
        v-model="amount"
        type="number"
        required
      >
    </label>

    <% if (swap) { %>
      <button
        type="button"
        class="secondary"
        @click="swapEnabled = !swapEnabled"
      >
        {{ swapEnabled ? "- Remove Swap" : "+ Add Swap" }}
      </button>

      <template v-if="swapEnabled">
        <label>
          Exchange
          <small>
            Optional. Auto lets the router pick a route. Hold Ctrl/Cmd to select
            specific exchanges.
          </small>
          <select
            multiple
            :size="exchangeSelectSize"
            :value="exchangeSelectValue"
            @change="onExchangeChange"
          >
            <option :value="AUTO_EXCHANGE_VALUE">
              Auto
            </option>
            <option
              v-for="chain in exchangeChains"
              :key="chain"
              :value="chain"
            >
              {{ chain }}
            </option>
          </select>
        </label>

        <label>
          Currency To
          <select
            v-model="currencyToOptionId"
            required
          >
            <option
              v-for="option in currencyToOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </template>
    <% } %>

    <button
      type="submit"
      :disabled="loading"
    >
      {{ loading ? "Submitting..." : "Submit transaction" }}
    </button>
  </form>
</template>
