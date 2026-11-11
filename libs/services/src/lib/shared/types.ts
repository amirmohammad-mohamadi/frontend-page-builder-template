import type { QueryKey } from "@tanstack/react-query";
import type { ApiErrorDto } from "@dtos";
import type { IPaginateModel } from "@models";

/** The error shape every hook and component branches on. */
export type ServerError = ApiErrorDto;

/** A list the backend adapter has normalised: items plus frontend-shaped pagination. */
export type NormalizedList<T> = {
  items: T[];
  paginate: IPaginateModel;
};

/** Options a feature hook may pass through to a shared query hook. */
export type BaseQueryOptions<T> = {
  queryKey?: QueryKey;
  enabled?: boolean;
  initialData?: T;
};

export type BaseQuery<T = unknown> = {
  queryOptions?: BaseQueryOptions<T>;
};

export type BaseQueryWithParams<T = unknown, P = unknown> = BaseQuery<T> & {
  params: P;
};
