/**
 * Fluent builder for URL query parameters: set or delete keys and drop the
 * ones that equal their defaults, so list URLs stay short and canonical.
 *
 * @example
 * const qs = new QueryParamBuilder(searchParams, { page: "1", per_page: "10" })
 *   .set("search", searchInput || null)
 *   .removeDefaults()
 *   .toString();
 */
export class QueryParamBuilder {
  private params: URLSearchParams;
  private defaults: Record<string, string>;

  constructor(existing: URLSearchParams | string = "", defaults: Record<string, string> = {}) {
    this.params = new URLSearchParams(existing);
    this.defaults = defaults;
  }

  /** Sets `key`, or deletes it when `value` is `null` or empty. */
  set(key: string, value: string | number | boolean | null | undefined): this {
    if (value === null || value === undefined || value === "") {
      this.params.delete(key);
    } else {
      this.params.set(key, String(value));
    }
    return this;
  }

  /** Removes every parameter that equals its default value. */
  removeDefaults(): this {
    for (const [key, defaultValue] of Object.entries(this.defaults)) {
      if (this.params.get(key) === defaultValue) this.params.delete(key);
    }
    return this;
  }

  /** The query string with a leading `?`, or an empty string. */
  toString(): string {
    const qs = this.params.toString();
    return qs ? `?${qs}` : "";
  }

  /** The query string without the leading `?`. */
  toStringRaw(): string {
    return this.params.toString();
  }
}
