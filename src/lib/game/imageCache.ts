export type ImageCacheEntry = HTMLImageElement | "loading" | "error";
export type ImageCache = Map<string, ImageCacheEntry>;

export type LoadCachedImageOptions = {
  /** Clear a prior failed load and try again (used for tulou stage backgrounds). */
  retryOnError?: boolean;
};

export function loadCachedImage(
  cache: ImageCache,
  src: string,
  onLoad?: () => void,
  options?: LoadCachedImageOptions,
): HTMLImageElement | null {
  const cached = cache.get(src);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached === "loading") return null;
  if (cached === "error" && !options?.retryOnError) return null;

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
