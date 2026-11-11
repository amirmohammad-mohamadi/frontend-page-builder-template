// Shared infrastructure
export * from "./lib/shared/types";
export * from "./lib/shared/backend-adapter";
export * from "./lib/shared/api-client";
export * from "./lib/shared/api-errors";
export * from "./lib/shared/bff-client";
export * from "./lib/shared/describe-error";
export * from "./lib/shared/transport";
export * from "./lib/shared/endpoints";
export * from "./lib/shared/query-gc-time";
export * from "./lib/shared/query-client-provider";
export * from "./lib/shared/hooks";

// Domains (browser-safe). Server-only auth plumbing is under "@services/auth/server".
export * from "./lib/auth";
export * from "./lib/example";
