import axios from "axios";
import { API_URL } from "../consts";

export const loadEvmOriginChains = async (): Promise<readonly string[]> => {
  const response = await axios.get<string[]>(`${API_URL}/chains/evm`);
  return response.data;
};
