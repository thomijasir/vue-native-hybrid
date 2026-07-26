/**
 * Image component props for optimized image display
 *
 * @example
 * ```tsx
 * <Image
 *   src="/photo.jpg"
 *   alt="Product photo"
 *   fallbackSrc="/placeholder.jpg"
 *   loading="lazy"
 * />
 * ```
 */
export interface ImageProps {
  /** Image source URL */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Fallback image URL if main src fails to load */
  fallbackSrc?: string;
  /** Image width (pixels or CSS value) */
  width?: string | number;
  /** Image height (pixels or CSS value) */
  height?: string | number;
  /** Loading strategy - 'lazy' defers loading until visible */
  loading?: "lazy" | "eager";
  /** Additional CSS classes */
  class?: string;
  /** Called when image loads successfully */
  onLoad?: (event: Event) => void;
  /** Called when image fails to load */
  onError?: (event: Event) => void;
}
