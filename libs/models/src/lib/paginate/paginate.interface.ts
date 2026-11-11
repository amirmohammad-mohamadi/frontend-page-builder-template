/** Frontend-owned pagination shape. The services layer maps whatever the backend sends onto this. */
export type IPaginateModel = {
  currentPage?: number;
  lastPage?: number;
  perPage?: number;
  total?: number;
};
