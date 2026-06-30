import { useCallback, useEffect, useRef, useState } from "react";
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
