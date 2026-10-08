/**
 * Хук: последнее непустое значение. Нужен диалогам, которые открываются по значению
 * (open={Boolean(item)}): при закрытии item становится null, а содержимое должно
 * оставаться на месте, пока идёт анимация исчезновения.
 */
import { useState } from "react";

export function useRetained(value) {
  const [kept, setKept] = useState(value);
  // Обновление состояния во время рендера — рекомендованный React способ «запомнить прошлый проп»
  if (value != null && value !== kept) setKept(value);
  return value ?? kept;
}
