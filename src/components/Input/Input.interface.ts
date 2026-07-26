/**
 * Input size variants
 * - `small` - Compact input for forms with limited space
 * - `medium` - Default size
 * - `large` - Larger input for emphasis
 */
export type InputSize = "small" | "medium" | "large";

/**
 * Text case transformation options
 */
export type TextCase = "normal" | "uppercase" | "lowercase";

/**
 * Input component props for text input fields.
 *
 * Use `v-model` for two-way binding. The underlying `<input>` element is
 * exposed via `defineExpose({ input })` for template-ref access.
 *
 * @example
 * ```vue
 * <Input
 *   v-model="email"
 *   label="Email"
 *   placeholder="Enter your email"
 * />
 * ```
 *
 * Slots:
 * - `start` - Element at the start of the input (icon, prefix)
 * - `end` - Element at the end of the input (icon, suffix)
 *
 * Emits:
 * - `change` - Committed value (blur or enter)
 * - `blur`, `focus`, `click`
 */
export interface InputProps {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display, or boolean to show error state */
  error?: string | boolean;
  /** Helper text displayed below the input */
  helperText?: string;
  /** If true (default), input takes full width of container */
  fullWidth?: boolean;
  /** Size variant of the input */
  size?: InputSize;
  /** Text case transformation */
  textCase?: TextCase;
  /** If true, input is non-interactive */
  disabled?: boolean;
  /** Placeholder text shown when input is empty */
  placeholder?: string;
  /** HTML input type attribute */
  type?: string;
  /** HTML id attribute for label association (auto-generated if omitted) */
  id?: string;
  /** Additional CSS classes for the input element */
  class?: string;
  /** Additional CSS classes for the container element */
  containerClass?: string;
}
