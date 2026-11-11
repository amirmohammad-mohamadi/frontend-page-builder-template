import type { ApiErrorDto } from "@dtos";
import type { IPaginateModel } from "@models";
import type { NormalizedList } from "./types";

/**
 * The one place that knows how a backend shapes its responses.
 *
 * Everything above this file (api files, hooks, components) sees only the
 * frontend's own shapes: a payload, a `NormalizedList`, an `ApiErrorDto`.
 * The default adapter recognises the common conventions (a `data` wrapper,
 * a `meta` or `pagination` block, page/pageSize at the root, `errors` as a
 * map or a list). A backend that differs overrides only
 * the method it needs with `configureBackendAdapter`, once, at app start.
 */
export type BackendAdapter = {
  /** The payload of a successful body. Default: `body.data` when present, else the body. */
  unwrap: <T>(body: unknown) => T;
  /** The items and pagination of a list body. */
  readList: <T>(body: unknown) => NormalizedList<T>;
  /** The error body mapped to the frontend's error shape. */
  readError: (body: unknown, status: number, statusText: string) => ApiErrorDto;
};

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null;

const toNumber = (value: unknown): number | undefined => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

function defaultUnwrap<T>(body: unknown): T {
  if (isRecord(body) && "data" in body && !Array.isArray(body) && Object.keys(body).length <= 3) {
    return body.data as T;
  }
  return body as T;
}

/** Pagination from `meta`, `pagination`, `_paginate` or the root, in several naming styles. */
function readPagination(body: AnyRecord): IPaginateModel {
  const source = [body.meta, body.pagination, body._paginate, body].find(isRecord) ?? {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = toNumber(source[key]);
      if (value !== undefined) return value;
    }
    return undefined;
  };
  const perPage = pick("per_page", "perPage", "pageSize", "page_size", "limit");
  const total = pick("total", "totalItems", "total_items", "count");
  const lastPage =
    pick("last_page", "lastPage", "total_pages", "totalPages", "pageCount") ??
    (perPage && total !== undefined ? Math.max(1, Math.ceil(total / perPage)) : undefined);
  return {
    currentPage: pick("current_page", "currentPage", "page"),
    perPage,
    total,
    lastPage,
  };
}

function defaultReadList<T>(body: unknown): NormalizedList<T> {
  if (Array.isArray(body)) return { items: body as T[], paginate: {} };
  if (!isRecord(body)) return { items: [], paginate: {} };
  const items = [body.data, body.items, body.results].find(Array.isArray) as T[] | undefined;
  return { items: items ?? [], paginate: readPagination(body) };
}

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** `errors` as `{ field: string | string[] }` or as a list of `{ field | field_name | path, message | errors }`. */
function readFieldErrors(raw: unknown): Record<string, string[]> | undefined {
  if (!raw) return undefined;
  const keyed: Record<string, string[]> = {};
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!isRecord(entry)) continue;
      const field = String(entry.field ?? entry.field_name ?? entry.path ?? entry.param ?? "_");
      const messages = isStringList(entry.errors)
        ? entry.errors
        : typeof entry.errors === "string"
          ? [entry.errors]
          : typeof entry.message === "string"
            ? [entry.message]
            : [];
      if (messages.length) keyed[field] = [...(keyed[field] ?? []), ...messages];
    }
  } else if (isRecord(raw)) {
    for (const [field, value] of Object.entries(raw)) {
      if (typeof value === "string") keyed[field] = [value];
      else if (isStringList(value)) keyed[field] = value;
    }
  }
  return Object.keys(keyed).length ? keyed : undefined;
}

function defaultReadError(body: unknown, status: number, statusText: string): ApiErrorDto {
  const record = isRecord(body) ? body : {};
  const nested = isRecord(record.error) ? record.error : {};
  const message =
    [record.message, nested.message, record.detail, record.title].find(
      (value): value is string => typeof value === "string" && value.trim() !== ""
    ) ??
    statusText ??
    "Request failed";
  const code = record.code ?? nested.code;
  return {
    message,
    statusCode: toNumber(record.statusCode ?? record.status) ?? status,
    code: typeof code === "number" || typeof code === "string" ? code : undefined,
    errors: readFieldErrors(record.errors ?? nested.errors ?? nested.details),
  };
}

export const defaultBackendAdapter: BackendAdapter = {
  unwrap: defaultUnwrap,
  readList: defaultReadList,
  readError: defaultReadError,
};

let adapter: BackendAdapter = defaultBackendAdapter;

/** Replaces part of the adapter for a backend whose shapes the default does not recognise. */
export function configureBackendAdapter(overrides: Partial<BackendAdapter>): void {
  adapter = { ...defaultBackendAdapter, ...overrides };
}

/** The adapter in use. */
export function getBackendAdapter(): BackendAdapter {
  return adapter;
}
