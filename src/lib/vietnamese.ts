/**
 * Normalize Vietnamese strings by stripping diacritical accents
 * and standardizing special characters like 'đ' -> 'd'.
 * Solves Vietnamese IME / Telex search issues where typing "Ga" matches "Gà".
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function matchesVietnameseSearch(target: string, query: string): boolean {
  if (!query) return true;
  const tNorm = normalizeVietnamese(target);
  const qNorm = normalizeVietnamese(query);
  return tNorm.includes(qNorm) || target.toLowerCase().includes(query.toLowerCase());
}
