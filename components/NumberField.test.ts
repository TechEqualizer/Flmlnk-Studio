import { describe, expect, test } from "vitest";
import { cleanInput, formatNumber, groupDigits } from "./NumberField";

describe("cleanInput", () => {
  test("keeps one decimal point while typing", () => {
    expect(cleanInput("4.", 2)).toBe("4.");
    expect(cleanInput("4.7", 2)).toBe("4.7");
    expect(cleanInput("4.735", 2)).toBe("4.73");
    expect(cleanInput("4..7.3", 2)).toBe("4.73");
    expect(cleanInput(".5", 2)).toBe("0.5");
  });
  test("drops commas, symbols and letters", () => {
    expect(cleanInput("$50,000.50", 2)).toBe("50000.50");
    expect(cleanInput("2.5x", 2)).toBe("2.5");
    expect(cleanInput("55%", 1)).toBe("55");
  });
  test("whole-number fields stop at the decimal point", () => {
    expect(cleanInput("90.5", 0)).toBe("90");
    expect(cleanInput("1,500", 0)).toBe("1500");
  });
});

describe("formatNumber", () => {
  test("money gets thousands separators and cents only when needed", () => {
    expect(formatNumber(50000, "money")).toBe("50,000");
    expect(formatNumber(1250.5, "money")).toBe("1,250.50");
  });
  test("rates always show cents, multipliers keep their decimals", () => {
    expect(formatNumber(4.73, "rate")).toBe("4.73");
    expect(formatNumber(5, "rate")).toBe("5.00");
    expect(formatNumber(2.5, "multiplier")).toBe("2.5");
    expect(formatNumber(7.25, "multiplier")).toBe("7.25");
    expect(formatNumber(55, "percent")).toBe("55");
  });
});

describe("groupDigits", () => {
  test("adds commas as the number grows", () => {
    expect(["5", "50", "500", "5000", "50000", "500000", "5000000"].map(groupDigits)).toEqual(["5", "50", "500", "5,000", "50,000", "500,000", "5,000,000"]);
  });
  test("leaves the decimal part alone and keeps a trailing point", () => {
    expect(groupDigits("125000.")).toBe("125,000.");
    expect(groupDigits("125000.5")).toBe("125,000.5");
    expect(groupDigits("1234.56")).toBe("1,234.56");
    expect(groupDigits("0.5")).toBe("0.5");
  });
  test("drops leading zeros", () => {
    expect(groupDigits("0050000")).toBe("50,000");
    expect(groupDigits("")).toBe("");
  });
});
