import type { Request, Response } from "express";
import { COOKIE_NAMES } from "../../shared/constants/index.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../../shared/utils/cookies.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { authService } from "./auth.service.js";
import type { LoginInput } from "./auth.validator.js";

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const result = await authService.login(input);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    sendSuccess(res, {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        avatarUrl: result.user.avatarUrl ?? undefined,
      },
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as
      | string
      | undefined;

    if (!refreshToken) {
      res
        .status(401)
        .json({ success: false, message: "Refresh token required" });
      return;
    }

    const result = await authService.refresh(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { refreshed: true });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as
      | string
      | undefined;
    await authService.logout(refreshToken);
    clearAuthCookies(res);
    sendSuccess(res, { loggedOut: true });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const user = await authService.getCurrentUser(req.user.id);

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? undefined,
      },
    });
  });
}

export const authController = new AuthController();
