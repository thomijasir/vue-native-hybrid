import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import Backdrop from "./Backdrop.component.vue";

describe("Backdrop", () => {
  it("renders a div with aria-hidden=true", () => {
    const wrapper = mount(Backdrop, { props: { isOpen: false } });
    expect(wrapper.find("div").exists()).toBe(true);
    expect(wrapper.find("div").attributes("aria-hidden")).toBe("true");
  });

  it("renders in the DOM when isOpen=false", () => {
    const wrapper = mount(Backdrop, { props: { isOpen: false } });
    expect(wrapper.find("div").exists()).toBe(true);
  });

  it("renders in the DOM when isOpen=true", () => {
    const wrapper = mount(Backdrop, { props: { isOpen: true } });
    expect(wrapper.find("div").exists()).toBe(true);
  });

  it("emits click when the backdrop is clicked", async () => {
    const wrapper = mount(Backdrop, { props: { isOpen: true } });
    await wrapper.find("div").trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("does not throw when clicked without click handler", async () => {
    const wrapper = mount(Backdrop, { props: { isOpen: true } });
    await expect(wrapper.find("div").trigger("click")).resolves.toBeUndefined();
  });
});
