import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAMES } from "../shared/constants/index.js";
import { HTTP_STATUS } from "../shared/constants/http-status.js";
import { AppError } from "../shared/utils/app-error.js";
import { verifyAccessToken } from "../shared/utils/jwt.js";

export const authenticateUser = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN] as string | undefined;

    if (!token) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError("Invalid or expired access token", HTTP_STATUS.UNAUTHORIZED));
  }
};
