import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Input from "./Input.component.vue";

describe("Input", () => {
  it("renders an input element", () => {
    const wrapper = mount(Input);
    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("uses a small radius and a strong, consistent resting border", () => {
    const wrapper = mount(Input);
    const surface = wrapper.find(".relative > div");

    expect(surface.classes()).toContain("rounded-sm");
    expect(surface.classes()).toContain("border-border-strong");
    expect(surface.classes()).toContain("focus-within:border-primary");
    expect(surface.classes()).not.toContain("border-transparent");
  });

  it("renders label", () => {
    const wrapper = mount(Input, { props: { label: "Email" } });
    expect(wrapper.text()).toContain("Email");
  });

  it("renders placeholder", () => {
    const wrapper = mount(Input, { props: { placeholder: "Enter value" } });
    expect(wrapper.find("input").attributes("placeholder")).toBe("Enter value");
  });

  it("displays value", () => {
    const wrapper = mount(Input, { props: { modelValue: "hello" } });
    expect(wrapper.find("input").element.value).toBe("hello");
  });

  it("emits update:modelValue with new value on input", async () => {
    const wrapper = mount(Input);
    await wrapper.find("input").setValue("test");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["test"]);
  });

  it("emits change on change", async () => {
    const wrapper = mount(Input);
    await wrapper.find("input").setValue("abc");
    await wrapper.find("input").trigger("change");
    expect(wrapper.emitted("change")?.[0]).toEqual(["abc"]);
  });

  it("shows error string", () => {
    const wrapper = mount(Input, { props: { error: "Required" } });
    expect(wrapper.text()).toContain("Required");
  });

  it("marks input as invalid on error", () => {
    const wrapper = mount(Input, { props: { error: "Err" } });
    expect(wrapper.find("input").attributes("aria-invalid")).toBe("true");
  });

  it("shows helper text", () => {
    const wrapper = mount(Input, { props: { helperText: "Helper" } });
    expect(wrapper.text()).toContain("Helper");
  });

  it("is disabled when disabled=true", () => {
    const wrapper = mount(Input, { props: { disabled: true } });
    expect(wrapper.find("input").attributes("disabled")).toBeDefined();
  });

  it("renders type=password", () => {
    const wrapper = mount(Input, { props: { type: "password" } });
    expect(wrapper.find("input").attributes("type")).toBe("password");
  });

  it("applies uppercase text case", async () => {
    const wrapper = mount(Input, { props: { textCase: "uppercase" } });
    await wrapper.find("input").setValue("hello");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["HELLO"]);
  });

  it("emits blur on blur", async () => {
    const wrapper = mount(Input);
    await wrapper.find("input").trigger("blur");
    expect(wrapper.emitted("blur")).toBeTruthy();
  });

  it("renders start and end slots", () => {
    const wrapper = mount(Input, {
      slots: { start: "<span>¥</span>", end: "<span>kg</span>" },
    });
    expect(wrapper.text()).toContain("¥");
    expect(wrapper.text()).toContain("kg");
  });
});
