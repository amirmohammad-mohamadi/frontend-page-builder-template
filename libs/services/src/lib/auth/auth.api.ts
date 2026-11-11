import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SessionUserDto,
} from "@dtos";
import { bffClient } from "../shared/bff-client";
import { endpoints } from "../shared/endpoints";

/**
 * The browser side of authentication. Every call goes to the app's own
 * `/api/auth/*` route (the BFF), which talks to the backend and keeps the
 * tokens in httpOnly cookies. The browser only ever sees the user.
 */
export const authApi = {
  login: (data: LoginDto) =>
    bffClient.post<{ user: SessionUserDto }>(endpoints.auth.bff.login, data),
  logout: () => bffClient.post<{ success: boolean }>(endpoints.auth.bff.logout),
  /** The signed-in user, or `{ user: null }` when there is no session. */
  me: () => bffClient.get<{ user: SessionUserDto | null }>(endpoints.auth.bff.me),
  register: (data: RegisterDto) =>
    bffClient.post<{ user: SessionUserDto }>(endpoints.auth.bff.register, data),
  forgotPassword: (data: ForgotPasswordDto) =>
    bffClient.post<{ success: boolean }>(endpoints.auth.bff.forgotPassword, data),
  resetPassword: (data: ResetPasswordDto) =>
    bffClient.post<{ user: SessionUserDto }>(endpoints.auth.bff.resetPassword, data),
};
