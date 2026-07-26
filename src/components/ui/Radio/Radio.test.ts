import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Radio from "./Radio.component.vue";

describe("Radio", () => {
  it("renders radio input", () => {
    const wrapper = mount(Radio, { props: { value: "test" } });
    expect(wrapper.find('input[type="radio"]').exists()).toBe(true);
  });

  it("uses a small radius and an even boxed border without a shadow", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label", variant: "boxed" },
    });

    expect(wrapper.classes()).toContain("rounded-sm");
    expect(wrapper.classes()).toContain("border-border-strong");
    expect(wrapper.classes()).not.toContain("shadow-usible-sm");
  });

  it("renders label", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "My Label" },
    });
    expect(wrapper.text()).toContain("My Label");
  });

  it("renders description", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label", description: "Some description" },
    });
    expect(wrapper.text()).toContain("Some description");
  });

  it("emits update:modelValue when radio is changed", async () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label" },
    });
    await wrapper.find('input[type="radio"]').setValue(true);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("disabled radio has disabled attribute", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label", disabled: true },
    });
    expect(wrapper.find("input").attributes("disabled")).toBeDefined();
  });

  it("error state applies border-error class", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label", error: true },
    });
    expect(wrapper.classes()).toContain("border-error");
  });

  it("boxed variant with checked applies themed primary surface", () => {
    const wrapper = mount(Radio, {
      props: {
        value: "test",
        label: "Label",
        variant: "boxed",
        modelValue: true,
      },
    });
    expect(wrapper.classes()).toContain("bg-primary-50");
  });

  it("renders without label", () => {
    const wrapper = mount(Radio, { props: { value: "test" } });
    expect(wrapper.find('input[type="radio"]').exists()).toBe(true);
  });

  it("applies containerClass", () => {
    const wrapper = mount(Radio, {
      props: {
        value: "test",
        label: "Label",
        containerClass: "custom-container",
      },
    });
    expect(wrapper.classes()).toContain("custom-container");
  });

  it("renders with inputPosition left", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label", inputPosition: "left" },
    });
    expect(wrapper.find('input[type="radio"]').exists()).toBe(true);
  });

  it("renders with icon slot", () => {
    const wrapper = mount(Radio, {
      props: { value: "test", label: "Label" },
      slots: { icon: "<span>Icon</span>" },
    });
    expect(wrapper.text()).toContain("Icon");
  });
});
