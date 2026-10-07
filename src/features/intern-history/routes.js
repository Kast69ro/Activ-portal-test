export const PAGE_SIZE = 20;
export const ATTEMPTS_PAGE_SIZE = 10;

export const HISTORY_ROUTES = {
  list: "/test-history",
  intern: (id) => `/test-history/intern/${id}`,
  attempt: (id) => `/test-history/attempt/${id}`,
};
