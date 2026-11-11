import { formatFileSize, formatIndex, formatMoney, formatNumber, formatPercent } from "./number";

describe("number formatting", () => {
  it("formats in the locale's digits and separators", () => {
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatNumber("1234", "de")).toBe("1.234");
    expect(formatNumber(1234, "fa")).toBe("۱٬۲۳۴");
  });

  it("returns an empty string for non-finite input", () => {
    expect(formatNumber(NaN)).toBe("");
    expect(formatNumber("abc")).toBe("");
  });

  it("falls back to en for an unknown locale tag", () => {
    expect(formatNumber(1000, "zz-INVALID-@@")).toBe("1,000");
  });

  it("formats indexes without grouping and with padding", () => {
    expect(formatIndex(1000, "en")).toBe("1000");
    expect(formatIndex(7, "en", 2)).toBe("07");
  });

  it("formats money, percentages and file sizes", () => {
    expect(formatMoney(1234.5, "en-US", "USD")).toBe("$1,234.50");
    expect(formatMoney(1234.5, "de-DE", "EUR")).toMatch(/1\.234,50\s€/);
    expect(formatPercent(0.256, "en")).toBe("26%");
    expect(formatFileSize(1536, "en")).toBe("1.5 kB");
    expect(formatFileSize(512, "en")).toBe("512 byte");
    expect(formatFileSize(-1)).toBe("");
  });
});
