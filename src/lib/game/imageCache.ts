export type ImageCacheEntry = HTMLImageElement | "loading" | "error";
export type ImageCache = Map<string, ImageCacheEntry>;

export function loadCachedImage(
  cache: ImageCache,
  src: string,
  onLoad?: () => void,
): HTMLImageElement | null {
  const cached = cache.get(src);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached === "loading" || cached === "error") return null;

  cache.set(src, "loading");
  const img = new Image();
  img.onload = () => {
    cache.set(src, img);
    onLoad?.();
  };
  img.onerror = () => cache.set(src, "error");
  img.src = src;
  return null;
}
