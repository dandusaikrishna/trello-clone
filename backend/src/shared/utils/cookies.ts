import type { Response } from "express";
import { env } from "../../config/env.js";
import { COOKIE_NAMES, TOKEN_LIFETIMES } from "../constants/index.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "none" as const, // temp to allow cross-origin requests
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...cookieOptions,
    maxAge: TOKEN_LIFETIMES.ACCESS_TOKEN_MS,
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...cookieOptions,
    maxAge: TOKEN_LIFETIMES.REFRESH_TOKEN_MS,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, cookieOptions);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
};
