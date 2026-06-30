import axios from "axios";
<% if (evmWallet) { -%>
import type { Hex } from "viem";
<% } -%>
import { API_URL } from "./consts<% if (framework === 'node') { %>.js<% } %>";
import type { ApiParams, ApiTransaction, ApiErrorResponse } from "./types<% if (framework === 'node') { %>.js<% } %>";

const postToApi = async <T>(
  url: string,
  params: ApiParams,
  errorContext: string,
): Promise<T> => {
  try {
    const response = await axios.post<T>(url, params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const message = error.response?.data.message;
      const serverMessage = message ? ` Server response: ${message}` : "";
      throw new Error(`Error while ${errorContext}.${serverMessage}`, {
        cause: error,
      });
    }
    throw error;
  }
};

export const fetchFromApi = (params: ApiParams): Promise<ApiTransaction[]> =>
  postToApi(`${API_URL}/x-transfers`, params, "fetching data");

<% if (evmWallet) { -%>
export const fetchFromEvmApi = (params: ApiParams): Promise<Hex> =>
  postToApi(`${API_URL}/evm-x-transfer`, params, "fetching EVM transaction");
<% } %>
