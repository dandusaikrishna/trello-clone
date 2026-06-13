import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { checklistService } from "./checklist.service.js";
import type {
  CreateChecklistInput,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from "./checklist.validator.js";

export class ChecklistController {
  createChecklist = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateChecklistInput;
    const checklist = await checklistService.createChecklist(
      getRouteParam(req, "cardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, checklist, HTTP_STATUS.CREATED);
  });

  createChecklistItem = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateChecklistItemInput;
    const item = await checklistService.createChecklistItem(input, req.user.id);
    sendSuccess(res, item, HTTP_STATUS.CREATED);
  });

  updateChecklistItem = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateChecklistItemInput;
    const item = await checklistService.updateChecklistItem(
      getRouteParam(req, "itemId"),
      input,
      req.user.id,
    );
    sendSuccess(res, item);
  });

  deleteChecklistItem = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await checklistService.deleteChecklistItem(getRouteParam(req, "itemId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });
}

export const checklistController = new ChecklistController();
