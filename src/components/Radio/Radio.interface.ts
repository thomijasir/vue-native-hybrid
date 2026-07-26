/** Radio presentation styles. */
export type RadioVariant = "boxed" | "plain";
/** Position of the radio input relative to label content. */
export type RadioInputPosition = "left" | "right";

/**
 * Props for the `Radio` component.
 *
 * Use `v-model` for two-way binding of the checked state.
 *
 * Slots:
 * - `label` - Custom label content (overrides the `label` prop)
 * - `description` - Custom description content
 * - `icon` - Leading icon rendered with the label
 */
export interface RadioProps {
  /** Label text displayed next to the radio control. */
  label?: string;
  /** Helper description shown below the label. */
  description?: string;
  /** Sets the control to error state. */
  error?: boolean;
  /** Disables user interaction. */
  disabled?: boolean;
  /** Optional id for input and label association (auto-generated if omitted). */
  id?: string;
  /** Native radio group name. */
  name?: string;
  /** Native form submission value. */
  value?: string;
  /** Radio input placement relative to text content. */
  inputPosition?: RadioInputPosition;
  /** Visual style variant. */
  variant?: RadioVariant;
  /** Additional class names for the radio root. */
  class?: string;
  /** Additional class names for the outer container. */
  containerClass?: string;
}
