/**
 * Button variant styles
 * - `filled` - Solid background with contrasting text
 * - `outlined` - Transparent background with border
 * - `text` - Minimal styling, no border or background
 * - `icon` - Circular button for icon content
 * - `iconOutline` - Circular button with border for icon content
 */
export type ButtonVariant =
  | "outlined"
  | "filled"
  | "text"
  | "icon"
  | "iconOutline";

/**
 * Button color themes using design system colors
 */
export type ButtonColor =
  | "primary"
  | "secondary"
  | "ternary"
  | "success"
  | "warning"
  | "error"
  | "transparent";

/**
 * Button size variants
 * - `small` - Compact size for tight spaces
 * - `medium` - Default size
 * - `large` - Prominent size for primary actions
 */
export type ButtonSize = "small" | "medium" | "large";

/**
 * Button component props
 *
 * @example
 * ```tsx
 * <Button variant="filled" color="primary" onClick={() => alert('clicked')}>
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps {
  /** If true, button takes full width of container */
  block?: boolean;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Color theme from design system */
  color?: ButtonColor;
  /** Size of the button */
  size?: ButtonSize;
  /** If true, button is non-interactive */
  disabled?: boolean;
  /** If true, shows loading spinner and disables interaction */
  loading?: boolean;
  /** Additional CSS classes */
  class?: string;
  /** HTML button type attribute */
  type?: "button" | "submit" | "reset";
}
