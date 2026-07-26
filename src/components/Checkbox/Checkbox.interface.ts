/**
 * Checkbox size variants
 */
export type CheckboxSize = "small" | "medium" | "large";

/**
 * Checkbox component props for form checkboxes.
 *
 * Use `v-model` for two-way binding of the checked state.
 *
 * @example
 * ```vue
 * <Checkbox v-model="agreed" label="I agree to the terms" />
 * ```
 *
 * Slots:
 * - `label` - Custom label content (overrides the `label` prop)
 */
export interface CheckboxProps {
  /** Label text displayed next to the checkbox */
  label?: string;
  /** Error state, can be boolean or error message string */
  error?: boolean | string;
  /** If true, checkbox is non-interactive */
  disabled?: boolean;
  /** Size variant of the checkbox */
  size?: CheckboxSize;
  /** HTML id attribute for label association (auto-generated if omitted) */
  id?: string;
  /** Additional CSS classes for the checkbox element */
  class?: string;
  /** Additional CSS classes for the container element */
  containerClass?: string;
}
