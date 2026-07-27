import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TSwapFragmentId = Extract<TFragmentId, `swap/${string}`>;

export const createSwapFragments: TFragmentFactory<TSwapFragmentId> = () => {
  return {
    'swap/exchangeChains.api.frontend': () => source`import axios from "axios";
        import { API_URL } from "../consts";
        
        export const loadExchangeChains = async (): Promise<readonly string[]> => {
          const response = await axios.get<string[]>(\`\${API_URL}/swap/exchange-chains\`);
          return response.data;
        };
        `,
    'swap/index.api':
      () => source`export { useExchangeChains } from "./useExchangeChains";
        `,
    'swap/useExchangeChains.react':
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
            void ensureExchangeChains().catch(() => undefined);
          }, [ensureExchangeChains]);
        
          return { chains };
        };
        `,
    'swap/useExchangeChains.vue':
      () => source`import { onMounted, ref, shallowRef } from "vue";
        import { loadExchangeChains } from "./exchangeChains";
        
        export const useExchangeChains = () => {
          const chains = ref<readonly string[]>([]);
          const fetchPromise = shallowRef<Promise<readonly string[]> | null>(null);
        
          const ensureExchangeChains = async (): Promise<readonly string[]> => {
            if (chains.value.length > 0) {
              return chains.value;
            }
        
            fetchPromise.value ??= loadExchangeChains();
            try {
              const result = await fetchPromise.value;
              chains.value = result;
              return result;
            } finally {
              fetchPromise.value = null;
            }
          };
        
          onMounted(() => {
            void ensureExchangeChains().catch(() => undefined);
          });
        
          return { chains };
        };
        `,
  };
};
