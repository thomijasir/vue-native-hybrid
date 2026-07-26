/**
 * Backdrop component props for overlay backgrounds
 *
 * @example
 * ```tsx
 * <Backdrop
 *   isOpen={isOpen()}
 *   onClick={() => setIsOpen(false)}
 *   opacity={0.5}
 * />
 */
export interface BackdropProps {
  /** Controls backdrop visibility */
  isOpen: boolean;
  /** Called when backdrop is clicked */
  onClick?: () => void;
  /** Opacity of the backdrop (0-1) */
  opacity?: number;
}
