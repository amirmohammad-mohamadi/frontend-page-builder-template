import { BaseModel } from "../base";
import type { IUserModel } from "./user.interface";

export class UserModel extends BaseModel<IUserModel> {
  getName(): string {
    return this.props.name ?? "";
  }

  getEmail(): string {
    return this.props.email ?? "";
  }

  getAvatarUrl(): string {
    return this.props.avatar_url ?? "";
  }

  /** The display name: the name, else the email, else an empty string. */
  getDisplayName(): string {
    return this.getName() || this.getEmail();
  }

  /** Up to two initials for an avatar fallback. */
  getInitials(): string {
    const source = this.getDisplayName();
    const words = source.split(/\s+/).filter(Boolean);
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }

  getRoles(): string[] {
    return this.props.roles ?? [];
  }

  getPermissions(): string[] {
    return this.props.permissions ?? [];
  }

  hasPermission(name: string): boolean {
    return this.getPermissions().includes(name);
  }

  hasAnyPermission(names: readonly string[]): boolean {
    return names.some((name) => this.hasPermission(name));
  }
}
