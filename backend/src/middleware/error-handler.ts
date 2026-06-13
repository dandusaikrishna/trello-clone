import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { HTTP_STATUS } from "../shared/constants/http-status.js";
import { AppError } from "../shared/utils/app-error.js";
import { sendError } from "../shared/utils/response.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode);
    return;
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(", ");
    sendError(res, message, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      sendError(res, "Resource not found", HTTP_STATUS.NOT_FOUND);
      return;
    }

    if (error.code === "P2002") {
      sendError(res, "Resource already exists", HTTP_STATUS.CONFLICT);
      return;
    }
  }

  console.error(error);
  sendError(res, "Something went wrong", HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
