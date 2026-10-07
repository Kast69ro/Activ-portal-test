import { useEffect, useState } from "react";

/** Значение, которое обновляется не чаще, чем раз в delay мс — для поиска при вводе */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
