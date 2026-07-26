/** Props for the accessible bottom-sheet Drawer component. */
export interface DrawerProps {
  /** Controls visibility when used with v-model. */
  modelValue?: boolean;
  /** Accessible name announced by assistive technology. */
  ariaLabel: string;
  /** Whether clicking the backdrop dismisses the drawer. */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape dismisses the drawer. */
  closeOnEscape?: boolean;
  /** Backdrop opacity from 0 to 1. */
  backdropOpacity?: number;
  /** Maximum height of the bottom sheet. */
  maxHeight?: string;
  /** Additional CSS classes for the drawer surface. */
  class?: string;
}
