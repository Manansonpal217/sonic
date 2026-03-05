'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MediaImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

const FALLBACK_BASE = process.env.NEXT_PUBLIC_MEDIA_FALLBACK_BASE_URL || '';

/**
 * Renders media images from the API. Uses native img to avoid Next.js Image
 * domain restrictions and optimization issues with external media URLs.
 * Falls back to production media URL when local returns 404.
 */
export function MediaImage({ src, alt, width = 48, height = 48, className }: MediaImageProps) {
  const [error, setError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = useCallback(() => {
    if (!triedFallback && FALLBACK_BASE && src) {
      setTriedFallback(true);
    } else {
      setError(true);
    }
  }, [triedFallback, src]);

  if (!src || error) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted text-muted-foreground rounded', className)}
        style={{ width, height }}
      >
        No image
      </div>
    );
  }

  // Extract path for fallback (e.g. /media/categories/xyz.jpg)
  const path = src.startsWith('http') ? new URL(src).pathname : src.startsWith('/') ? src : `/${src}`;
  const fallbackSrc = triedFallback && FALLBACK_BASE ? `${FALLBACK_BASE.replace(/\/$/, '')}${path}` : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fallbackSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded object-cover', className)}
      onError={handleError}
    />
  );
}
