import { describe, it, expect } from "vitest";
import { formatFileSize, validateFileExtension } from "./file.util";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });
  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });
  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
  it("formats with one decimal", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});

describe("validateFileExtension", () => {
  it("returns true for valid extension", () => {
    const file = new File([""], "doc.pdf", { type: "application/pdf" });
    expect(validateFileExtension(file, ["pdf", "doc"])).toBe(true);
  });
  it("returns false for invalid extension", () => {
    const file = new File([""], "image.exe", {
      type: "application/octet-stream",
    });
    expect(validateFileExtension(file, ["pdf", "doc"])).toBe(false);
  });
  it("is case insensitive", () => {
    const file = new File([""], "photo.JPG", { type: "image/jpeg" });
    expect(validateFileExtension(file, ["jpg", "jpeg"])).toBe(true);
  });
});
