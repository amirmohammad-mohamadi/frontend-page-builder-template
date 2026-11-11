import type { IPaginateModel } from "./paginate.interface";

/** Pagination state of a list response, with the derived has-next / has-previous flags. */
export class PaginateModel {
  protected readonly props: IPaginateModel;

  constructor(data?: IPaginateModel) {
    this.props = data ?? {};
  }

  getTotalItems(): number {
    return this.props.total ?? 0;
  }

  getItemsPerPage(): number {
    return this.props.perPage ?? 0;
  }

  getCurrentPage(): number {
    return this.props.currentPage ?? 1;
  }

  getLastPage(): number {
    return this.props.lastPage ?? 1;
  }

  getHasNextPage(): boolean {
    return this.getCurrentPage() < this.getLastPage();
  }

  getHasPreviousPage(): boolean {
    return this.getCurrentPage() > 1;
  }
}
