"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductVisual } from "@/components/ProductVisual";

type ProductImageProps = {
  /** Source URL. A data: URL (local file preview) or any external host. */
  src?: string;
  product: Product;
  className?: string;
  /** Wrapper class used when a fallback is shown instead of the image. */
  fallbackClassName?: string;
  /**
   * Overrides the branded SVG visual, for screens that have their own
   * placeholder such as the portal's category icon.
   */
  fallback?: React.ReactNode;
};

/**
 * Product image with the branded SVG visual as a graceful fallback.
 *
 * Arbitrary hosts — data: URLs from a local file picker, or an external URL a
 * user typed in — are unenumerable, so they are rendered with a plain <img>
 * and never proxied through the next/image optimizer. Supabase Storage URLs
 * from this project are a known host listed in next.config.ts
 * `images.remotePatterns`, so those use `next/image`.
 *
 * A broken source (404, host unreachable, CORS) swaps in the SVG visual rather
 * than leaving a broken-image glyph. The previous implementation did this by
 * mutating `img.style.display` inside onError, which hid the state from React
 * and left stale inline styles behind; this keeps it in component state and
 * resets when the source changes.
 */
export function ProductImage({ src, product, className, fallbackClassName, fallback }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  // A new source should retry rather than stay stuck on the previous fallback.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return fallback ? (
      <div className={fallbackClassName ?? className}>{fallback}</div>
    ) : (
      <div className={fallbackClassName ?? className}>
        <ProductVisual product={product} />
      </div>
    );
  }

  return (
    // Arbitrary user-supplied URLs (data: previews, external hosts) are
    // unenumerable in images.remotePatterns, so they cannot go through the
    // next/image optimizer. Supabase Storage URLs are the one known host; when
    // configured they can be switched to next/image here. Keeping this in one
    // component means the exception is documented once, not at every call site.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={product.name}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
