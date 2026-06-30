import axios from "axios";
import { API_URL } from "../consts";

export const loadExchangeChains = async (): Promise<readonly string[]> => {
  const response = await axios.get<string[]>(`${API_URL}/swap/exchange-chains`);
  return response.data;
};
