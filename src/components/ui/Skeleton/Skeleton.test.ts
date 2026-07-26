import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Skeleton from "./Skeleton.component.vue";

describe("Skeleton", () => {
  it("default variant=text uses the shared small radius", () => {
    const wrapper = mount(Skeleton);
    expect(wrapper.classes()).toContain("rounded-sm");
  });

  it("circular variant uses a full radius", () => {
    const wrapper = mount(Skeleton, { props: { variant: "circular" } });
    expect(wrapper.classes()).toContain("rounded-full");
  });

  it("animation=pulse has animate-pulse class", () => {
    const wrapper = mount(Skeleton, { props: { animation: "pulse" } });
    expect(wrapper.classes()).toContain("animate-pulse");
  });

  it("animation=none does not have animate-pulse class", () => {
    const wrapper = mount(Skeleton, { props: { animation: "none" } });
    expect(wrapper.classes()).not.toContain("animate-pulse");
  });

  it("applies width style when provided", () => {
    const wrapper = mount(Skeleton, { props: { width: "200px" } });
    expect((wrapper.element as HTMLElement).style.width).toBe("200px");
  });

  it("applies height style when provided", () => {
    const wrapper = mount(Skeleton, { props: { height: "50px" } });
    expect((wrapper.element as HTMLElement).style.height).toBe("50px");
  });

  it("applies custom class", () => {
    const wrapper = mount(Skeleton, { props: { class: "my-skeleton" } });
    expect(wrapper.classes()).toContain("my-skeleton");
  });
});
