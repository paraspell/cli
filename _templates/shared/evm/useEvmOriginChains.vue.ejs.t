import { onMounted, ref } from "vue";
import { loadEvmOriginChains } from "./evmOrigins";

export const useEvmOriginChains = () => {
  const chains = ref<readonly string[]>([]);
  let fetchPromise: Promise<readonly string[]> | null = null;

  const ensureEvmOriginChains = async (): Promise<readonly string[]> => {
    if (chains.value.length > 0) {
      return chains.value;
    }

    fetchPromise ??= loadEvmOriginChains();
    try {
      const result = await fetchPromise;
      chains.value = result;
      return result;
    } finally {
      fetchPromise = null;
    }
  };

  const isEvmOrigin = (chain: string) => chains.value.includes(chain);

  onMounted(() => {
    void ensureEvmOriginChains();
  });

  return { chains, isEvmOrigin, ensureEvmOriginChains };
};
