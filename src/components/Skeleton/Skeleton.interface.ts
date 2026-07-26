/**
 * Skeleton shape variants
 * - `text` - Rounded rectangular (for text lines)
 * - `rectangular` - Sharp corners (for cards, boxes)
 * - `circular` - Circle (for avatars)
 */
export type SkeletonVariant = "text" | "rectangular" | "circular";

/**
 * Skeleton animation options
 */
export type SkeletonAnimation = "pulse" | "none";

/**
 * Skeleton component props for loading placeholders
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width={200} height={20} />
 * <Skeleton variant="circular" width={40} height={40} />
 * ```
 */
export interface SkeletonProps {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Width (pixels or CSS value) */
  width?: string | number;
  /** Height (pixels or CSS value) */
  height?: string | number;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Additional CSS classes */
  class?: string;
}
