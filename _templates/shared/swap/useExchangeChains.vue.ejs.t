import { onMounted, ref } from "vue";
import { loadExchangeChains } from "./exchangeChains";

export const useExchangeChains = () => {
  const chains = ref<readonly string[]>([]);
  let fetchPromise: Promise<readonly string[]> | null = null;

  const ensureExchangeChains = async (): Promise<readonly string[]> => {
    if (chains.value.length > 0) {
      return chains.value;
    }

    fetchPromise ??= loadExchangeChains();
    try {
      const result = await fetchPromise;
      chains.value = result;
      return result;
    } finally {
      fetchPromise = null;
    }
  };

  onMounted(() => {
    void ensureExchangeChains();
  });

  return { chains };
};
