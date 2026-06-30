---
to: src/XcmTransferForm.vue
---
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import useCurrencyOptions from "./useCurrencyOptions";
import {
  CHAINS,<% if (swap) { %>
  EXCHANGE_CHAINS,
  isExchange,
  type TExchangeChain,<% } %>
  isChain,
  type TChain,
} from "<%= sdkPackage %>";
import type { FormValues } from "./types";

const props = defineProps<{
  loading: boolean;
  originChain: TChain;
}>();

const emit = defineEmits<{
  submit: [values: FormValues];
  originChange: [origin: TChain];
}>();

const destinationChain = ref<TChain>("Hydration");
const currencyOptionId = ref("");
<% if (swap) { %>const currencyToOptionId = ref("");
const swapEnabled = ref(false);
const exchange = ref<TExchangeChain[]>([]);
const AUTO_EXCHANGE_VALUE = "";
const exchangeSelectValue = computed(() =>
  exchange.value.length > 0 ? exchange.value : [AUTO_EXCHANGE_VALUE],
);
const exchangeSelectSize = EXCHANGE_CHAINS.length + 1;
<% } %>const recipient = ref("5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96");
const amount = ref("5");

const from = computed(() => props.originChain);
const to = computed(() => destinationChain.value);

const { currencyOptions, currencyMap<% if (swap) { %>, currencyToOptions, currencyToMap<% } %> } =
  useCurrencyOptions(from, to<% if (swap) { %>, swapEnabled, exchange<% } %>);

watch(
  currencyOptions,
  (opts) => {
    if (opts.length > 0) {
      currencyOptionId.value = opts[opts.length - 1].value;
    }
  },
  { immediate: true },
);<% if (swap) { %>

watch(
  currencyToOptions,
  (opts) => {
    if (opts.length > 0) {
      currencyToOptionId.value = opts[opts.length - 1].value;
    }
  },
  { immediate: true },
);<% } %>

<% if (swap) { %>const onExchangeChange = (e: Event) => {
  const target = e.target;
  if (!(target instanceof HTMLSelectElement)) return;

  exchange.value = Array.from(target.selectedOptions, (o) => o.value).filter(
    isExchange,
  );
};

<% } %>const onOriginChange = (e: Event) => {
  const target = e.target;
  if (!(target instanceof HTMLSelectElement)) return;

  const chain = target.value;
  if (isChain(chain)) {
    emit("originChange", chain);
  }
};

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!currencyOptionId.value) return;<% if (swap) { %>
  if (swapEnabled.value && !currencyToOptionId.value) return;
<% } %>
  emit("submit", {
    from: props.originChain,
    to: destinationChain.value,
    currencyOptionId: currencyOptionId.value,
    recipient: recipient.value,
    amount: amount.value,
    currency: currencyMap.value[currencyOptionId.value],<% if (swap) { %>
    swapEnabled: swapEnabled.value,
    currencyTo: swapEnabled.value
      ? currencyToMap.value[currencyToOptionId.value]
      : undefined,
    exchange: exchange.value,<% } %>
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
        @change="onOriginChange"
      >
        <option
          v-for="chain in CHAINS"
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
          v-for="chain in CHAINS"
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
          v-for="currency in currencyOptions"
          :key="currency.value"
          :value="currency.value"
        >
          {{ currency.label }}
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
    </label><% if (swap) { %>

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
          Optional. Auto lets the router pick a route. Hold Ctrl/Cmd to select specific exchanges.
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
            v-for="chain in EXCHANGE_CHAINS"
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
            v-for="currency in currencyToOptions"
            :key="currency.value"
            :value="currency.value"
          >
            {{ currency.label }}
          </option>
        </select>
      </label>
    </template><% } %>

    <button
      type="submit"
      :disabled="loading"
    >
      {{ loading ? "Submitting..." : "Submit transaction" }}
    </button>
  </form>
</template>
