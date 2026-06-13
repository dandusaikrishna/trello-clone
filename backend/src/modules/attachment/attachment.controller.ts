import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { attachmentService } from "./attachment.service.js";
import type { CreateAttachmentInput, SignUploadInput } from "./attachment.validator.js";

export class AttachmentController {
  signUpload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as SignUploadInput;
    const result = await attachmentService.signUpload(input, req.user.id);
    sendSuccess(res, result);
  });

  createAttachment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateAttachmentInput;
    const attachment = await attachmentService.createAttachment(
      getRouteParam(req, "cardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, attachment, HTTP_STATUS.CREATED);
  });

  deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await attachmentService.deleteAttachment(getRouteParam(req, "attachmentId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });
}

export const attachmentController = new AttachmentController();
