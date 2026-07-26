/**
 * Text typography variants
 * - `h1` - Hero heading (2.5rem)
 * - `h2` - Section heading (2rem)
 * - `h3` - Subsection heading (1.5rem)
 * - `h4` - Card heading (1.25rem)
 * - `h5` - Small heading (1.125rem)
 * - `h6` - Smallest heading (1rem)
 * - `subtitle1` - Large subtitle (1rem)
 * - `subtitle2` - Small subtitle (0.875rem)
 * - `body1` - Primary body text (1rem)
 * - `body2` - Secondary body text (0.875rem)
 * - `button` - Button text style
 * - `caption` - Caption text (0.75rem)
 * - `overline` - Overline text (0.625rem, uppercase)
 */
export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "button"
  | "caption"
  | "overline";

/**
 * Text color options from design system
 */
export type TextColor =
  | "primary"
  | "secondary"
  | "ternary"
  | "text"
  | "success"
  | "warning"
  | "error"
  | "white";

/**
 * Text component props for typography
 *
 * @example
 * ```tsx
 * <Text variant="h1" color="primary">Welcome</Text>
 * <Text variant="body1" color="secondary">This is a description.</Text>
 * ```
 */
export interface TextProps {
  /** Typography variant */
  variant?: TextVariant;
  /** Color from design system */
  color?: TextColor;
  /** Additional CSS classes */
  class?: string;
}
