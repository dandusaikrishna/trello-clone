import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { labelService } from "./label.service.js";
import type { AssignLabelInput, CreateLabelInput } from "./label.validator.js";

export class LabelController {
  createLabel = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateLabelInput;
    const label = await labelService.createLabel(input, req.user.id);
    sendSuccess(res, label, HTTP_STATUS.CREATED);
  });

  assignLabelToCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as AssignLabelInput;
    const assignment = await labelService.assignLabelToCard(
      getRouteParam(req, "cardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, assignment, HTTP_STATUS.CREATED);
  });

  removeLabelFromCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await labelService.removeLabelFromCard(
      getRouteParam(req, "cardId"),
      getRouteParam(req, "labelId"),
      req.user.id,
    );
    sendSuccess(res, { removed: true });
  });
}

export const labelController = new LabelController();
