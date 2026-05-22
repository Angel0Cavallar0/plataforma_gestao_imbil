import { CAROUSEL_MAX_ITEMS, CAROUSEL_MIN_ITEMS } from "@/lib/constants/marketing";

export function sortAssetsByDisplayOrder<T extends { display_order: number }>(
  assets: T[],
): T[] {
  return [...assets].sort((a, b) => a.display_order - b.display_order);
}

export function validateCarouselAssetCount(count: number): string | null {
  if (count < CAROUSEL_MIN_ITEMS) {
    return `Carrossel exige no mínimo ${CAROUSEL_MIN_ITEMS} imagens (atual: ${count})`;
  }
  if (count > CAROUSEL_MAX_ITEMS) {
    return `Carrossel permite no máximo ${CAROUSEL_MAX_ITEMS} imagens (atual: ${count})`;
  }
  return null;
}
