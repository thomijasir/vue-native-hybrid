import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import Button from "./Button.component.vue";

describe("Button", () => {
  it("renders children", () => {
    const wrapper = mount(Button, { slots: { default: "Click me" } });
    expect(wrapper.find("button").text()).toBe("Click me");
  });

  it("defaults to type=button", () => {
    const wrapper = mount(Button, { slots: { default: "B" } });
    expect(wrapper.find("button").attributes("type")).toBe("button");
  });

  it("renders type=submit", () => {
    const wrapper = mount(Button, {
      props: { type: "submit" },
      slots: { default: "Submit" },
    });
    expect(wrapper.find("button").attributes("type")).toBe("submit");
  });

  it("applies filled primary classes by default", () => {
    const wrapper = mount(Button, { slots: { default: "B" } });
    expect(wrapper.find("button").classes()).toContain("bg-primary");
  });

  it("applies w-full when block=true", () => {
    const wrapper = mount(Button, {
      props: { block: true },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").classes()).toContain("w-full");
  });

  it("is disabled when disabled=true", () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
  });

  it("is disabled when loading=true", () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
    expect(wrapper.find("button").attributes("aria-busy")).toBe("true");
  });

  it("shows loader when loading", () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: "B" },
    });
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it("emits click when clicked", async () => {
    const onClick = vi.fn();
    const wrapper = mount(Button, {
      slots: { default: "B" },
      attrs: { onClick },
    });
    await wrapper.find("button").trigger("click");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not emit click when disabled", async () => {
    const onClick = vi.fn();
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: "B" },
      attrs: { onClick },
    });
    await wrapper.find("button").trigger("click");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies small size classes", () => {
    const wrapper = mount(Button, {
      props: { size: "small" },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").classes()).toContain("py-2.5");
  });

  it("applies large size classes", () => {
    const wrapper = mount(Button, {
      props: { size: "large" },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").classes()).toContain("py-4");
  });

  it("applies outlined variant classes", () => {
    const wrapper = mount(Button, {
      props: { variant: "outlined" },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").classes()).toContain("border");
  });

  it("applies secondary color", () => {
    const wrapper = mount(Button, {
      props: { color: "secondary" },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").classes()).toContain("bg-secondary");
  });

  it("applies error color", () => {
    const wrapper = mount(Button, {
      props: { color: "error" },
      slots: { default: "B" },
    });
    expect(wrapper.find("button").classes()).toContain("bg-error");
  });
});
