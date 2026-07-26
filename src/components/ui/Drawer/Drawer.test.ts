import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import Backdrop from "~/components/ui/Backdrop/Backdrop.component.vue";
import Drawer from "./Drawer.component.vue";

const mountDrawer = (
  props: Record<string, unknown> = {},
  slots: Record<string, string> = {},
) =>
  mount(Drawer, {
    attachTo: document.body,
    props: {
      ariaLabel: "Example drawer",
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

describe("Drawer", () => {
  it("renders an accessible bottom sheet with slotted content", () => {
    const wrapper = mountDrawer(
      { modelValue: true },
      { default: "<p>Drawer content</p>" },
    );
    const drawer = wrapper.get('[role="dialog"]');

    expect(drawer.attributes("aria-modal")).toBe("true");
    expect(drawer.attributes("aria-label")).toBe("Example drawer");
    expect(drawer.classes()).toContain("bottom-0");
    expect(drawer.classes()).toContain("rounded-t-sm");
    expect(drawer.text()).toContain("Drawer content");
  });

  it("does not render the surface while closed", () => {
    const wrapper = mountDrawer({ modelValue: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("uses the backdrop opacity and dismisses from backdrop clicks", async () => {
    const wrapper = mountDrawer({
      modelValue: true,
      backdropOpacity: 0.65,
    });
    const backdrop = wrapper.getComponent(Backdrop);

    expect(backdrop.props("opacity")).toBe(0.65);
    await backdrop.get("div").trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("can disable backdrop and Escape dismissal", async () => {
    const wrapper = mountDrawer({
      modelValue: true,
      closeOnBackdrop: false,
      closeOnEscape: false,
    });

    await wrapper.getComponent(Backdrop).get("div").trigger("click");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();

    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("dismisses on Escape", async () => {
    const wrapper = mountDrawer({ modelValue: true });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("applies max height and custom classes", () => {
    const wrapper = mountDrawer({
      modelValue: true,
      maxHeight: "70svh",
      class: "drawer-custom",
    });
    const drawer = wrapper.get('[role="dialog"]');

    expect(drawer.attributes("style")).toContain("max-height: 70svh");
    expect(drawer.classes()).toContain("drawer-custom");
  });

  it("focuses content and restores previous focus after closing", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const wrapper = mountDrawer(
      { modelValue: true },
      { default: "<button data-action>Continue</button>" },
    );
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get("[data-action]").element);

    await wrapper.setProps({ modelValue: false });
    await nextTick();
    expect(document.activeElement).toBe(opener);
  });

  it("locks body scrolling and restores it on unmount", async () => {
    document.body.style.overflow = "scroll";
    const wrapper = mountDrawer({ modelValue: true });
    await nextTick();
    expect(document.body.style.overflow).toBe("hidden");

    wrapper.unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
