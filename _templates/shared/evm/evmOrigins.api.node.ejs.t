import axios from "axios";
import { API_URL } from "./consts.js";

let cachedEvmOriginChains: readonly string[] = [];
let fetchPromise: Promise<readonly string[]> | null = null;

export const fetchEvmOriginChains = async (): Promise<readonly string[]> => {
  if (cachedEvmOriginChains.length > 0) {
    return cachedEvmOriginChains;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = axios
    .get<string[]>(`${API_URL}/chains/evm`)
    .then((response) => {
      cachedEvmOriginChains = response.data;
      return cachedEvmOriginChains;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
};

export const getEvmOriginChains = (): readonly string[] => cachedEvmOriginChains;

export const isEvmOrigin = (chain: string): boolean =>
  getEvmOriginChains().includes(chain);
