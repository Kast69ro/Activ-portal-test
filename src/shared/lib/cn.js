/** Склеивает className, пропуская пустые значения. */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
