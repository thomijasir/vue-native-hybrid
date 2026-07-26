/** Props for the accessible modal Dialog component. */
export interface DialogProps {
  /** Controls visibility when used with v-model. */
  modelValue?: boolean;
  /** Accessible name announced by assistive technology. */
  ariaLabel: string;
  /** Whether clicking the backdrop dismisses the dialog. */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape dismisses the dialog. */
  closeOnEscape?: boolean;
  /** Backdrop opacity from 0 to 1. */
  backdropOpacity?: number;
  /** Maximum width of the dialog surface. */
  maxWidth?: string;
  /** Additional CSS classes for the dialog surface. */
  class?: string;
}
