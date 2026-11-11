import type { IBaseModel } from "../base";

/** The signed-in user as the auth routes return it. Extend per project; keep the fields the shell relies on. */
export type IUserModel = IBaseModel & {
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
  /** Role names, for display. Access decisions use `permissions`. */
  roles?: string[];
  /** Permission names the user holds; an empty or missing list means none are known. */
  permissions?: string[];
};
