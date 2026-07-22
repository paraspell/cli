import type { FragmentFactory, FragmentId } from "./contracts.js";
import { source } from "../source.js";

type SwapFragmentId = Extract<FragmentId, `swap/${string}`>;

export const createSwapFragments: FragmentFactory<SwapFragmentId> = () => {
  return {
    "swap/exchangeChains.api.frontend": () => source`import axios from "axios";
        import { API_URL } from "../consts";
        
        export const loadExchangeChains = async (): Promise<readonly string[]> => {
          const response = await axios.get<string[]>(\`\${API_URL}/swap/exchange-chains\`);
          return response.data;
        };
        `,
    "swap/index.api":
      () => source`export { useExchangeChains } from "./useExchangeChains";
        `,
    "swap/useExchangeChains.react":
      () => source`import { useCallback, useEffect, useRef, useState } from "react";
        import { loadExchangeChains } from "./exchangeChains";
        
        export const useExchangeChains = () => {
          const [chains, setChains] = useState<readonly string[]>([]);
          const fetchPromiseRef = useRef<Promise<readonly string[]> | null>(null);
        
          const ensureExchangeChains = useCallback(async (): Promise<readonly string[]> => {
            if (chains.length > 0) {
              return chains;
            }
        
            fetchPromiseRef.current ??= loadExchangeChains();
            try {
              const result = await fetchPromiseRef.current;
              setChains(result);
              return result;
            } finally {
              fetchPromiseRef.current = null;
            }
          }, [chains]);
        
          useEffect(() => {
            void ensureExchangeChains();
          }, [ensureExchangeChains]);
        
          return { chains };
        };
        `,
    "swap/useExchangeChains.vue":
      () => source`import { onMounted, ref } from "vue";
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
        `,
  };
};
