import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Checkbox from "./Checkbox.component.vue";

describe("Checkbox", () => {
  it("renders a checkbox input", () => {
    const wrapper = mount(Checkbox);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  it("renders label when provided", () => {
    const wrapper = mount(Checkbox, { props: { label: "Accept terms" } });
    expect(wrapper.text()).toContain("Accept terms");
  });

  it("does not render label when not provided", () => {
    const wrapper = mount(Checkbox);
    expect(wrapper.find("label").exists()).toBe(false);
  });

  it("is checked when modelValue=true", () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } });
    expect(wrapper.find("input").element.checked).toBe(true);
  });

  it("is not checked when modelValue=false", () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } });
    expect(wrapper.find("input").element.checked).toBe(false);
  });

  it("emits update:modelValue true when checked", async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } });
    await wrapper.find("input").setValue(true);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("emits update:modelValue false when unchecked", async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } });
    await wrapper.find("input").setValue(false);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("is disabled when disabled=true", () => {
    const wrapper = mount(Checkbox, { props: { disabled: true } });
    expect(wrapper.find("input").attributes("disabled")).toBeDefined();
  });

  it("applies border-error class when error is provided", () => {
    const wrapper = mount(Checkbox, { props: { error: "Required field" } });
    expect(wrapper.find("input").classes()).toContain("border-error");
  });
});
