import type { Request, Response } from "express";
import { HTTP_STATUS } from "../shared/constants/http-status.js";
import { sendError } from "../shared/utils/response.js";

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, "Route not found", HTTP_STATUS.NOT_FOUND);
};
