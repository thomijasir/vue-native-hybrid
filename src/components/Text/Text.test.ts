import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Text from "./Text.component.vue";

describe("Text", () => {
  it("renders body1 (p) by default", () => {
    const wrapper = mount(Text, { slots: { default: "Hello" } });
    expect(wrapper.element.tagName).toBe("P");
    expect(wrapper.classes()).toContain("text-base");
    expect(wrapper.classes()).toContain("text-foreground");
    expect(wrapper.text()).toBe("Hello");
  });

  it("renders h1 variant", () => {
    const wrapper = mount(Text, {
      props: { variant: "h1" },
      slots: { default: "Heading" },
    });
    expect(wrapper.element.tagName).toBe("H1");
    expect(wrapper.classes()).toContain("text-5xl");
    expect(wrapper.classes()).toContain("font-bold");
  });

  it("renders h6 variant", () => {
    const wrapper = mount(Text, {
      props: { variant: "h6" },
      slots: { default: "Sub" },
    });
    expect(wrapper.element.tagName).toBe("H6");
    expect(wrapper.classes()).toContain("text-lg");
  });

  it("renders caption as span", () => {
    const wrapper = mount(Text, {
      props: { variant: "caption" },
      slots: { default: "Cap" },
    });
    expect(wrapper.element.tagName).toBe("SPAN");
    expect(wrapper.classes()).toContain("text-xs");
  });

  it("applies primary color", () => {
    const wrapper = mount(Text, {
      props: { color: "primary" },
      slots: { default: "Primary" },
    });
    expect(wrapper.classes()).toContain("text-primary");
  });

  it("applies error color", () => {
    const wrapper = mount(Text, {
      props: { color: "error" },
      slots: { default: "Error" },
    });
    expect(wrapper.classes()).toContain("text-error");
  });

  it("applies custom class", () => {
    const wrapper = mount(Text, {
      props: { class: "custom-cls" },
      slots: { default: "Custom" },
    });
    expect(wrapper.classes()).toContain("custom-cls");
  });

  it("lets custom text color classes override the default color", () => {
    const wrapper = mount(Text, {
      props: { class: "text-blue-600 dark:text-blue-400" },
      slots: { default: "Custom color" },
    });
    expect(wrapper.classes()).toContain("text-blue-600");
    expect(wrapper.classes()).toContain("dark:text-blue-400");
    expect(wrapper.classes()).not.toContain("text-foreground");
  });

  it("renders subtitle1 as h6", () => {
    const wrapper = mount(Text, {
      props: { variant: "subtitle1" },
      slots: { default: "Sub1" },
    });
    expect(wrapper.element.tagName).toBe("H6");
    expect(wrapper.classes()).toContain("text-base");
    expect(wrapper.classes()).toContain("font-medium");
  });
});
