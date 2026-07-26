import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import Image from "./Image.component.vue";

const SRC = "https://example.com/image.jpg";

describe("Image", () => {
  it("renders container div", () => {
    const wrapper = mount(Image);
    expect(wrapper.element).toBeTruthy();
  });

  it("shows img element when src is provided", () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: "Test image" } });
    expect(wrapper.find("img").exists()).toBe(true);
  });

  it("img has correct alt attribute", () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: "My alt text" } });
    expect(wrapper.find("img").attributes("alt")).toBe("My alt text");
  });

  it("shows fallback element when no src is provided", () => {
    const wrapper = mount(Image, { props: { alt: "no source" } });
    expect(wrapper.find('[data-testid="image-fallback"]').exists()).toBe(true);
  });

  it("does not show fallback when src is provided", () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: "has src" } });
    expect(wrapper.find('[data-testid="image-fallback"]').exists()).toBe(false);
  });

  it("applies width and height as inline styles", () => {
    const wrapper = mount(Image, { props: { width: 200, height: 150, alt: "sized" } });
    const style = (wrapper.element as HTMLElement).getAttribute("style") ?? "";
    expect(style).toContain("200px");
    expect(style).toContain("150px");
  });

  it("applies width and height as string", () => {
    const wrapper = mount(Image, { props: { width: "100%", height: "auto", alt: "sized" } });
    const style = (wrapper.element as HTMLElement).getAttribute("style") ?? "";
    expect(style).toContain("width: 100%");
    expect(style).toContain("height: auto");
  });

  it("applies custom class", () => {
    const wrapper = mount(Image, {
      props: { src: SRC, alt: "test", class: "custom-class" },
    });
    expect(wrapper.classes()).toContain("custom-class");
  });

  it("emits load when image loads", async () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: "test" } });
    await wrapper.find("img").trigger("load");
    expect(wrapper.emitted("load")).toBeTruthy();
  });

  it("emits error when image fails to load", async () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: "test" } });
    await wrapper.find("img").trigger("error");
    expect(wrapper.emitted("error")).toBeTruthy();
  });

  it("shows fallback when image fails to load without fallbackSrc", async () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: "test" } });
    await wrapper.find("img").trigger("error");
    expect(wrapper.find('[data-testid="image-fallback"]').exists()).toBe(true);
  });

  it("shows fallback icon with alt text when error", async () => {
    const wrapper = mount(Image, {
      props: { src: SRC, alt: "Custom error alt" },
    });
    await wrapper.find("img").trigger("error");
    const fallback = wrapper.find('[data-testid="image-fallback"]');
    expect(fallback.html()).toContain("aria-label");
  });

  it("uses fallbackSrc when image fails to load", async () => {
    const wrapper = mount(Image, {
      props: {
        src: SRC,
        alt: "test",
        fallbackSrc: "https://example.com/fallback.jpg",
      },
    });
    await wrapper.find("img").trigger("error");
    expect(wrapper.find("img").attributes("src")).toContain("fallback.jpg");
  });
});
