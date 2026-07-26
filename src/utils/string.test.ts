import { describe, it, expect } from "vitest";
import { stripAndKebabCase } from "./string.util";

describe("stripAndKebabCase", () => {
  it("converts PascalCase to kebab-case", () => {
    expect(stripAndKebabCase("MyComponent")).toBe("my-component");
  });
  it("removes Story suffix", () => {
    expect(stripAndKebabCase("MyComponentStory")).toBe("my-component");
  });
  it("handles already lowercase string", () => {
    expect(stripAndKebabCase("button")).toBe("button");
  });
  it("handles single word", () => {
    expect(stripAndKebabCase("Button")).toBe("button");
  });
  it("handles word that is only Story", () => {
    expect(stripAndKebabCase("Story")).toBe("");
  });
});
