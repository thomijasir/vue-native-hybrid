import { describe, it, expect } from "vitest";
import {
  daysInMonth,
  getFirstDayOfMonth,
  isSameDate,
  isDateDisabled,
  formatDate,
  addMonths,
} from "./date.util";

describe("daysInMonth", () => {
  it("returns 31 for January", () => {
    expect(daysInMonth(new Date(2024, 0, 1))).toBe(31);
  });
  it("returns 29 for February in leap year", () => {
    expect(daysInMonth(new Date(2024, 1, 1))).toBe(29);
  });
  it("returns 28 for February in non-leap year", () => {
    expect(daysInMonth(new Date(2023, 1, 1))).toBe(28);
  });
  it("returns 30 for April", () => {
    expect(daysInMonth(new Date(2024, 3, 1))).toBe(30);
  });
});

describe("getFirstDayOfMonth", () => {
  it("returns 1 (Monday) for 2024-01-01", () => {
    expect(getFirstDayOfMonth(new Date(2024, 0, 1))).toBe(1);
  });
});

describe("isSameDate", () => {
  it("returns true for same date", () => {
    expect(isSameDate(new Date(2024, 0, 15), new Date(2024, 0, 15))).toBe(true);
  });
  it("returns false for different dates", () => {
    expect(isSameDate(new Date(2024, 0, 15), new Date(2024, 0, 16))).toBe(
      false,
    );
  });
  it("returns false if either is null", () => {
    expect(isSameDate(null, new Date(2024, 0, 15))).toBe(false);
    expect(isSameDate(new Date(2024, 0, 15), null)).toBe(false);
  });
});

describe("isDateDisabled", () => {
  it("returns true when date is before minDate", () => {
    expect(isDateDisabled(new Date(2024, 0, 1), new Date(2024, 0, 5))).toBe(
      true,
    );
  });
  it("returns true when date is after maxDate", () => {
    expect(
      isDateDisabled(new Date(2024, 0, 10), undefined, new Date(2024, 0, 5)),
    ).toBe(true);
  });
  it("returns false when date is within range", () => {
    expect(
      isDateDisabled(
        new Date(2024, 0, 5),
        new Date(2024, 0, 1),
        new Date(2024, 0, 10),
      ),
    ).toBe(false);
  });
  it("returns false with no constraints", () => {
    expect(isDateDisabled(new Date(2024, 0, 5))).toBe(false);
  });
});

describe("formatDate", () => {
  it("formats date as DD/MM/YYYY", () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe("05/01/2024");
  });
  it("pads single-digit day and month", () => {
    expect(formatDate(new Date(2024, 8, 3))).toBe("03/09/2024");
  });
});

describe("addMonths", () => {
  it("adds months to a date", () => {
    const result = addMonths(new Date(2024, 0, 15), 2);
    expect(result.getMonth()).toBe(2);
    expect(result.getFullYear()).toBe(2024);
  });
  it("rolls over year when adding months past December", () => {
    const result = addMonths(new Date(2024, 11, 1), 2);
    expect(result.getMonth()).toBe(1);
    expect(result.getFullYear()).toBe(2025);
  });
  it("subtracts months with negative value", () => {
    const result = addMonths(new Date(2024, 2, 15), -1);
    expect(result.getMonth()).toBe(1);
  });
});
