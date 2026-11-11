import { isJwtExpired, jwtExpiry, jwtSecondsToExpiry } from "./jwt";

const token = (payload: Record<string, unknown>) =>
  `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

describe("jwt helpers", () => {
  const now = Math.floor(Date.now() / 1000);

  it("reads exp from an unsigned token", () => {
    expect(jwtExpiry(token({ exp: now + 60 }))).toBe(now + 60);
    expect(jwtSecondsToExpiry(token({ exp: now + 60 }))).toBeGreaterThan(50);
  });

  it("treats a missing or malformed exp as unknown", () => {
    expect(jwtExpiry(token({}))).toBeNull();
    expect(jwtExpiry("not.a.jwt")).toBeNull();
    expect(jwtExpiry("")).toBeNull();
    expect(jwtSecondsToExpiry(token({ exp: now - 10 }))).toBeNull();
  });

  it("isJwtExpired is strict only when exp is readable", () => {
    expect(isJwtExpired(token({ exp: now - 10 }))).toBe(true);
    expect(isJwtExpired(token({ exp: now + 10 }))).toBe(false);
    expect(isJwtExpired("garbage")).toBe(false);
  });
});
