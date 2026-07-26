import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import Backdrop from "~/components/ui/Backdrop/Backdrop.component.vue";
import Dialog from "./Dialog.component.vue";

const mountDialog = (
  props: Record<string, unknown> = {},
  slots: Record<string, string> = {},
) =>
  mount(Dialog, {
    attachTo: document.body,
    props: {
      ariaLabel: "Example dialog",
      ...props,
    },
    slots,
    global: {
      stubs: { teleport: true },
    },
  });

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

describe("Dialog", () => {
  it("renders accessible slotted content while open", () => {
    const wrapper = mountDialog(
      { modelValue: true },
      { default: "<p>Dialog content</p>" },
    );
    const dialog = wrapper.get('[role="dialog"]');

    expect(dialog.attributes("aria-modal")).toBe("true");
    expect(dialog.attributes("aria-label")).toBe("Example dialog");
    expect(dialog.text()).toContain("Dialog content");
  });

  it("does not render the surface while closed", () => {
    const wrapper = mountDialog({ modelValue: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("uses the backdrop opacity and dismisses from backdrop clicks", async () => {
    const wrapper = mountDialog({
      modelValue: true,
      backdropOpacity: 0.7,
    });
    const backdrop = wrapper.getComponent(Backdrop);

    expect(backdrop.props("opacity")).toBe(0.7);
    await backdrop.get("div").trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("can disable backdrop dismissal", async () => {
    const wrapper = mountDialog({
      modelValue: true,
      closeOnBackdrop: false,
    });

    await wrapper.getComponent(Backdrop).get("div").trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("dismisses on Escape and supports opting out", async () => {
    const wrapper = mountDialog({ modelValue: true });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    wrapper.unmount();

    const persistent = mountDialog({
      modelValue: true,
      closeOnEscape: false,
    });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(persistent.emitted("update:modelValue")).toBeUndefined();
  });

  it("applies max width and custom classes", () => {
    const wrapper = mountDialog({
      modelValue: true,
      maxWidth: "40rem",
      class: "dialog-custom",
    });
    const dialog = wrapper.get('[role="dialog"]');

    expect(dialog.attributes("style")).toContain("max-width: 40rem");
    expect(dialog.classes()).toContain("dialog-custom");
  });

  it("focuses content, traps Tab, and restores previous focus", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const wrapper = mountDialog(
      { modelValue: true },
      {
        default:
          "<button data-first>First</button><button data-last>Last</button>",
      },
    );
    await nextTick();

    const first = wrapper.get("[data-first]").element as HTMLElement;
    const last = wrapper.get("[data-last]").element as HTMLElement;
    expect(document.activeElement).toBe(first);

    last.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", cancelable: true }),
    );
    expect(document.activeElement).toBe(first);

    await wrapper.setProps({ modelValue: false });
    await nextTick();
    expect(document.activeElement).toBe(opener);
  });

  it("locks body scrolling and restores it on unmount", async () => {
    document.body.style.overflow = "auto";
    const wrapper = mountDialog({ modelValue: true });
    await nextTick();
    expect(document.body.style.overflow).toBe("hidden");

    wrapper.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
