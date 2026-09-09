import { useState } from 'react';

export const IMAGE_UNAVAILABLE =
  'https://placehold.co/800x800/111827/e5e7eb?text=Image+Unavailable';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

/** Внешнее изображение товара: lazy, cover, fade-in, onError fallback */
export function ProductImage({ src, alt, className = '' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      width={800}
      height={800}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (currentSrc !== IMAGE_UNAVAILABLE) setCurrentSrc(IMAGE_UNAVAILABLE);
      }}
      className={`aspect-square w-full h-full object-cover transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    />
  );
}

/** Основной URL изображения товара (images[0]) */
export function getProductImageUrl(product: { imageUrl?: string; images?: string[] }): string {
  return product.imageUrl ?? product.images?.[0] ?? IMAGE_UNAVAILABLE;
}
