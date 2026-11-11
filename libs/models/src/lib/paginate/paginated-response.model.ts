import type { IPaginateModel } from "./paginate.interface";
import { PaginateModel } from "./paginate.model";

/** A list already normalised by the services layer: items plus frontend-shaped pagination. */
export type IPaginatedList<T> = {
  items: T[];
  paginate: IPaginateModel;
};

/** Wraps a normalised list, building a model instance per item on demand. */
export class PaginatedResponseModel<TProps, TModel> {
  protected readonly props: IPaginatedList<TProps>;
  protected readonly itemConstructor: new (data?: Partial<TProps>) => TModel;

  constructor(
    itemConstructor: new (data?: Partial<TProps>) => TModel,
    data?: IPaginatedList<TProps>
  ) {
    this.itemConstructor = itemConstructor;
    this.props = data ?? { items: [], paginate: {} };
  }

  getItems(): TModel[] {
    return this.props.items.map((item) => new this.itemConstructor(item));
  }

  getPaginate(): PaginateModel {
    return new PaginateModel(this.props.paginate);
  }
}
