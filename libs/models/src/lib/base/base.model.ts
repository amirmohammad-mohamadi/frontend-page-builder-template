import type { IBaseModel } from "./base.interface";

/**
 * Base of every domain model: a thin class over the raw API record (`props`)
 * with typed getters, so UI code never reaches into response shapes directly.
 * Subclasses add getters for their own fields and keep `props` private.
 */
export abstract class BaseModel<TProps extends IBaseModel = IBaseModel> {
  protected readonly props: Partial<TProps>;

  constructor(data?: Partial<TProps>) {
    this.props = data ?? {};
  }

  getId(): number | string {
    return this.props.id ?? 0;
  }

  getCreatedAt(): Date | null {
    return this.props.created_at ? new Date(this.props.created_at) : null;
  }

  getUpdatedAt(): Date | null {
    return this.props.updated_at ? new Date(this.props.updated_at) : null;
  }

  getDeletedAt(): Date | null {
    return this.props.deleted_at ? new Date(this.props.deleted_at) : null;
  }

  /** The raw record, for forms that need default values. */
  toJSON(): Partial<TProps> {
    return this.props;
  }
}
