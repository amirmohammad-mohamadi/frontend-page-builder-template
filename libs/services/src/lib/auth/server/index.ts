// Server-only auth plumbing for Next.js route handlers and middleware.
// Import as `@services/auth/server`; never from the `@services` barrel, which
// client components load.
export * from "./config";
export * from "./jwt";
export * from "./create-auth-server";
export * from "./guard";
export * from "./proxy-target";
