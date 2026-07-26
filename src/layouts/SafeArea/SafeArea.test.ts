import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SafeAreaLayout from "./SafeArea.layout.vue";

describe("SafeArea.layout", () => {
  it("renders with default classes", () => {
    const wrapper = mount(SafeAreaLayout);

    expect(wrapper.find("main").classes()).toEqual(["safe-area"]);
    expect(wrapper.find(".safe-area__content").exists()).toBe(true);
  });

  it("applies containerClass and contentClass props", () => {
    const wrapper = mount(SafeAreaLayout, {
      props: { containerClass: "page-home", contentClass: "p-4" },
    });

    expect(wrapper.find("main").classes()).toEqual(["safe-area", "page-home"]);
    expect(wrapper.find(".safe-area__content").classes()).toEqual([
      "safe-area__content",
      "p-4",
    ]);
  });

  it("renders slotted content", () => {
    const wrapper = mount(SafeAreaLayout, {
      slots: { default: "<p>content</p>" },
    });

    expect(wrapper.find(".safe-area__content p").text()).toBe("content");
  });
});
