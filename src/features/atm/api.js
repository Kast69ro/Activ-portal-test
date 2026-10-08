/**
 * API банкоматов. Тегов нет: данные только читаются. Используется только доменом atm.
 *   service "atm"          — мониторинг (PHP, VITE_ATM_API_URL): состояние, кассеты, ошибки
 *   service "transactions" — операции по банкомату за период (VITE_TRANSACTIONS_API_URL)
 */
import { baseApi } from "@/shared/api/baseApi";
import { toAtm } from "./model/atm";
import { toTransaction } from "./model/transactions";

const asList = (res) => (Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : []);

export const atmApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Все банкоматы с состоянием кассет, ошибками и предупреждениями → [toAtm(...)] */
    getAtms: build.query({
      query: () => ({ url: "/mtm_atm.php", service: "atm" }),
      transformResponse: (res) => (Array.isArray(res?.items) ? res.items.map(toAtm) : []),
    }),
    /** Операции банкомата за период (даты — «YYYY-MM-DD») → [toTransaction(...)] */
    getAtmTransactions: build.query({
      query: ({ atmId, fromDate, toDate }) => ({
        url: "/Transactions/by-atm",
        service: "transactions",
        params: { atmId, fromDate, toDate },
      }),
      transformResponse: (res) => asList(res).map(toTransaction),
    }),
  }),
});

export const { useGetAtmsQuery, useGetAtmTransactionsQuery } = atmApi;
