import { formatDate, formatDateTime, formatRelativeTime } from "./date";

const date = new Date(Date.UTC(2026, 9, 31, 13, 5));

describe("date formatting", () => {
  it("formats with the locale and explicit options", () => {
    expect(
      formatDate(date, "en-GB", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    ).toBe("31 Oct 2026");
    expect(
      formatDate(date.toISOString(), "fa-IR-u-ca-persian", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
      })
    ).toMatch(/۱۴۰۵/);
  });

  it("returns an empty string for empty or invalid input", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("not a date")).toBe("");
    expect(formatDateTime(undefined)).toBe("");
  });

  it("formats date and time together", () => {
    expect(formatDateTime(date, "en-GB", { timeZone: "UTC" })).toBe("31/10/2026, 13:05");
  });

  it("picks the largest relative unit", () => {
    const now = new Date(date.getTime());
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 86_400_000), "en", now)).toBe(
      "3 days ago"
    );
    expect(formatRelativeTime(new Date(now.getTime() + 2 * 3_600_000), "en", now)).toBe(
      "in 2 hours"
    );
    expect(formatRelativeTime(now, "en", now)).toBe("now");
  });
});
