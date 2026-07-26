import { nextTick, onBeforeUnmount, type Ref, watch } from "vue";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useModalSurface(
  isOpen: Ref<boolean>,
  surface: Ref<HTMLElement | null>,
  closeOnEscape: () => boolean,
) {
  let previousFocus: HTMLElement | null = null;
  let previousBodyOverflow = "";
  let isActive = false;

  const focusableElements = () =>
    surface.value
      ? Array.from(
          surface.value.querySelectorAll<HTMLElement>(focusableSelector),
        )
      : [];

  const focusSurface = () => {
    const firstFocusable = focusableElements()[0];
    (firstFocusable ?? surface.value)?.focus({ preventScroll: true });
  };

  const dismiss = () => {
    isOpen.value = false;
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && closeOnEscape()) {
      event.preventDefault();
      dismiss();
      return;
    }

    if (event.key !== "Tab" || !surface.value) return;

    const focusable = focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      surface.value.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (
      event.shiftKey &&
      (activeElement === first || activeElement === surface.value)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!surface.value.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  const activate = async () => {
    if (isActive) return;
    isActive = true;
    previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    await nextTick();
    focusSurface();
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = previousBodyOverflow;
    previousFocus?.focus({ preventScroll: true });
    previousFocus = null;
  };

  watch(isOpen, (open) => (open ? activate() : deactivate()), {
    immediate: true,
  });
  onBeforeUnmount(deactivate);

  return { dismiss };
}
